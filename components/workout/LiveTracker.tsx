import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Workout, ProgressState, WorkoutLog, WorkoutExercise, SessionFeedback } from '../../types/kinetix';
import { soundService } from '../../services/soundService';
import { storageService } from '../../services/storageService';
import { EXERCISES_DB } from '../../constants/exercises';
import { getYoutubeEmbedUrl } from '../../lib/youtube';
import { UnitConverterModal } from '../ui/UnitConverterModal';
import { getWeightEquivalenceHint, WeightUnit } from '../../lib/units';
import { QuickNotes } from './QuickNotes';

interface Props {
  workout: Workout;
  onFinish: (data: ProgressState) => void;
  onExit?: () => void;
  user?: any;
}

const parseWeightValue = (input: string | undefined): number => {
  if (!input) return 0;
  const clean = input.toString().replace(/,/g, '.').replace(/[^0-9.]/g, ''); 
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
};

const getSmartCoachDirective = (ex: WorkoutExercise, dbEx?: { technique?: string; commonErrors?: string[]; muscleGroup?: string }): string => {
  if (ex.coachCue && ex.coachCue.trim()) return ex.coachCue.trim();
  const parts: string[] = [];
  if (dbEx?.technique) parts.push(dbEx.technique.trim());
  if (ex.method === 'biserie' || ex.method === 'triserie' || ex.method === 'giant_set') {
    parts.push('Ejecuta los bloques seguidos sin descanso intermedio; descansa solo al cerrar la ronda.');
  } else if (ex.method === 'dropset') {
    parts.push('Al fallar técnicamente, reduce el peso 20-30% de inmediato y continúa sin descanso.');
  } else if (ex.method === 'ahap' || ex.setType === 'top_set') {
    parts.push('Serie pesada principal: controla la fase excéntrica y prioriza técnica limpia.');
  } else if (ex.method === 'tabata' || ex.method === 'emom') {
    parts.push('Usa el reloj acústico integrado para respetar exactamente los intervalos de trabajo.');
  }
  if (dbEx?.commonErrors && dbEx.commonErrors.length > 0) {
    parts.push(`Evita: ${dbEx.commonErrors[0]}.`);
  }
  if (ex.targetRir) {
    parts.push(`Mantén RIR ${ex.targetRir} (repeticiones en recámara).`);
  }
  return parts.join(' ') || 'Controla la fase excéntrica, respira de forma firme y completa todo el rango de movimiento.';
};

interface TrackingRow {
  type: 'base' | 'drop' | 'interval' | 'pair';
  label: string;
  targetWeight: string;
  targetReps: string;
  exerciseName: string;
  exerciseId: string;
  globalIndex: number;
  videoUrl?: string;
}

const generateTrackingRows = (ex: WorkoutExercise): TrackingRow[] => {
  const rows: TrackingRow[] = [];
  let counter = 0;

  if (ex.method === 'emom' || ex.method === 'tabata') {
    const isEmom = ex.method === 'emom';
    const totalUnits = (isEmom ? ex.emomConfig?.durationMin : ex.tabataConfig?.rounds) || 8;
    const sequence = (isEmom ? ex.emomConfig?.sequence : ex.tabataConfig?.sequence) || [];
    for (let i = 0; i < totalUnits; i++) {
      const step = sequence[i % sequence.length] || { exerciseId: ex.exerciseId, name: ex.name, targetReps: '10' };
      rows.push({ 
        type: 'interval', 
        label: isEmom ? `Min ${i+1}` : `Rnd ${i+1}`, 
        targetWeight: step.targetLoad || '0', 
        targetReps: step.targetReps || '10', 
        exerciseName: step.name, 
        exerciseId: step.exerciseId, 
        globalIndex: counter++, 
        videoUrl: step.videoUrl 
      });
    }
    return rows;
  }

  if ((ex.method === 'biserie' || ex.method === 'triserie' || ex.method === 'giant_set') && ex.pair) {
    const chain = ex.supersetChain || [];
    for (let i = 0; i < (ex.targetSets || 3); i++) {
      // Ejercicio A
      rows.push({ 
        type: 'pair', 
        label: `A - Set ${i+1}`, 
        targetWeight: ex.targetLoad?.split(',')[i]?.trim() || '0', 
        targetReps: ex.targetReps?.split(',')[i]?.trim() || '10', 
        exerciseName: ex.name, 
        exerciseId: ex.exerciseId, 
        globalIndex: counter++, 
        videoUrl: ex.videoUrl 
      });
      // Ejercicio B
      rows.push({ 
        type: 'pair', 
        label: `B - Set ${i+1}`, 
        targetWeight: (ex.pair.targetLoad || '').split(',')[i]?.trim() || '0', 
        targetReps: (ex.pair.targetReps || '').split(',')[i]?.trim() || '10', 
        exerciseName: ex.pair.name, 
        exerciseId: ex.pair.exerciseId, 
        globalIndex: counter++, 
        videoUrl: ex.pair.videoUrl 
      });
      // Ejercicios C, D, E... para Triserie o Serie Gigante
      if (ex.method === 'triserie' || ex.method === 'giant_set') {
        const letters = ['C', 'D', 'E', 'F', 'G'];
        chain.forEach((sub, sIdx) => {
          const letter = letters[sIdx] || `+${sIdx+1}`;
          rows.push({ 
            type: 'pair', 
            label: `${letter} - Set ${i+1}`, 
            targetWeight: (sub.targetLoad || '').split(',')[i]?.trim() || '0', 
            targetReps: (sub.targetReps || '').split(',')[i]?.trim() || '10', 
            exerciseName: sub.name, 
            exerciseId: sub.exerciseId, 
            globalIndex: counter++, 
            videoUrl: sub.videoUrl 
          });
        });
      }
    }
    return rows;
  }

  if (ex.method === 'dropset' && ex.dropsetConfig) {
    for (let i = 0; i < (ex.targetSets || 3); i++) {
      rows.push({ 
        type: 'base', 
        label: `Set ${i+1}`, 
        targetWeight: ex.targetLoad?.split(',')[i]?.trim() || '0', 
        targetReps: ex.targetReps?.split(',')[i]?.trim() || '10', 
        exerciseName: ex.name, 
        exerciseId: ex.exerciseId, 
        globalIndex: counter++, 
        videoUrl: ex.videoUrl 
      });
      ex.dropsetConfig.drops.forEach((d, dIdx) => {
        rows.push({ 
          type: 'drop', 
          label: `Drop ${dIdx+1}`, 
          targetWeight: d.weight.split(',')[i]?.trim() || '0', 
          targetReps: d.reps.split(',')[i]?.trim() || '10', 
          exerciseName: ex.name, 
          exerciseId: ex.exerciseId, 
          globalIndex: counter++, 
          videoUrl: ex.videoUrl 
        });
      });
    }
    return rows;
  }

  for (let i = 0; i < (ex.targetSets || 3); i++) {
    rows.push({ 
      type: 'base', 
      label: `Set ${i+1}`, 
      targetWeight: ex.targetLoad?.split(',')[i]?.trim() || '0', 
      targetReps: ex.targetReps?.split(',')[i]?.trim() || '10', 
      exerciseName: ex.name, 
      exerciseId: ex.exerciseId, 
      globalIndex: counter++, 
      videoUrl: ex.videoUrl 
    });
  }
  return rows;
};

export const LiveTracker: React.FC<Props> = ({ workout, onFinish, onExit, user }) => {
  const draftKey = useMemo(
    () => `kinetix_draft_${user?.id || 'anon'}_${workout.id}_${storageService.getServerTodayIsoSync()}`,
    [user?.id, workout.id]
  );

  const [progress, setProgress] = useState<ProgressState>(() => {
    try {
      const savedDraft = localStorage.getItem(
        `kinetix_draft_${user?.id || 'anon'}_${workout.id}_${storageService.getServerTodayIsoSync()}`
      );
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.workoutLogs)) {
          return {
            currentExerciseIndex: 0,
            completedSets: parsed.workoutLogs.length || 0,
            isPairTurn: false,
            subIndex: 0,
            performanceData: parsed.performanceData || {},
            workoutLogs: parsed.workoutLogs || [],
            emomCurrentMin: 1,
            tabataCurrentRound: 1,
            tabataCurrentSet: 1
          };
        }
      }
    } catch {}
    return {
      currentExerciseIndex: 0,
      completedSets: 0,
      isPairTurn: false,
      subIndex: 0,
      performanceData: {},
      workoutLogs: [],
      emomCurrentMin: 1,
      tabataCurrentRound: 1,
      tabataCurrentSet: 1
    };
  });

  const [expandedIdx, setExpandedIdx] = useState<number | null>(workout.exercises.length > 0 ? 0 : null);
  const [displayUnit, setDisplayUnit] = useState<WeightUnit>(user?.preferredUnit || 'kg');
  const [elapsed, setElapsed] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [feedback, setFeedback] = useState<SessionFeedback>({ rpe: 7, fatigue: 3, notes: '' });
  const [aiDebrief, setAiDebrief] = useState<string | null>(null);
  const [showConverter, setShowConverter] = useState(false);
  const [privacyShield, setPrivacyShield] = useState(false);
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      if (progress.workoutLogs.length > 0 || Object.keys(progress.performanceData).length > 0) {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            performanceData: progress.performanceData,
            workoutLogs: progress.workoutLogs,
            savedAt: Date.now()
          })
        );
      }
    } catch {}
  }, [draftKey, progress.performanceData, progress.workoutLogs]);

  const previousNoteMap = useMemo(() => {
    const map: Record<string, string> = {};
    workout.exercises.forEach(ex => {
      const prev = storageService.getLastExerciseNote(ex.exerciseId, user?.id);
      if (prev) map[ex.exerciseId] = prev;
    });
    return map;
  }, [workout, user?.id]);

  const handleExerciseNoteChange = (exerciseId: string, note: string) => {
    setExerciseNotes(prev => ({ ...prev, [exerciseId]: note }));
    setProgress(p => ({
      ...p,
      workoutLogs: p.workoutLogs.map(l =>
        l.exerciseId === exerciseId ? { ...l, notes: note.trim() || undefined } : l
      )
    }));
  };

  const handleSaveExerciseNoteToCloud = async (exerciseId: string, note: string) => {
    return storageService.saveExerciseQuickNote(exerciseId, note, user?.id, workout.id, workout.name);
  };

  const goToExercise = (idx: number | null) => {
    setExpandedIdx(idx);
    if (idx !== null) {
      setTimeout(() => {
        document.getElementById(`kinetix-ex-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  // Protección anticaptura: bloqueo de atajos (PrintScreen, Ctrl+P/S/U) y escudo al cambiar de app/pestaña
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || ((e.ctrlKey || e.metaKey) && ['p', 's', 'u'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
        setPrivacyShield(true);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        setPrivacyShield(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // TONELAJE TOTAL COMPUTADO EN TIEMPO REAL
  const currentTonnage = useMemo(() => {
    return progress.workoutLogs.reduce((acc, l) => acc + (Number(l.weight || 0) * Number(l.reps || 0)), 0);
  }, [progress.workoutLogs]);

  // REST TIMER STATE
  const [restTimer, setRestTimer] = useState<{
    active: boolean;
    secondsLeft: number;
    totalSeconds: number;
    exerciseName: string;
  } | null>(null);

  // INTERVAL TIMER MODAL (TABATA / EMOM)
  const [intervalModal, setIntervalModal] = useState<{
    open: boolean;
    exercise: WorkoutExercise;
    mode: 'tabata' | 'emom';
    isRunning: boolean;
    phase: 'work' | 'rest';
    secondsLeft: number;
    currentRound: number;
    totalRounds: number;
    workDuration: number;
    restDuration: number;
  } | null>(null);

  const [copiedPrevIdx, setCopiedPrevIdx] = useState<number | null>(null);

  const ghostMap = useMemo(() => {
    const map: Record<string, { weight: number; reps: number }> = {};
    const collect = (exId?: string) => {
      if (!exId || map[exId]) return;
      const last = storageService.getLastPerformance(exId, user?.id);
      if (last && (last.weight > 0 || last.reps > 0)) map[exId] = last;
    };
    workout.exercises.forEach(ex => {
      collect(ex.exerciseId);
      if (ex.pair?.exerciseId) collect(ex.pair.exerciseId);
      (ex.supersetChain || []).forEach(sub => collect(sub.exerciseId));
    });
    return map;
  }, [workout, user?.id]);

  // Overall workout elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // AUTOMATIC REST TIMER EFFECT WITH ACOUSTIC BEEPS (440Hz and 880Hz)
  useEffect(() => {
    if (!restTimer || !restTimer.active) return;

    const timer = setInterval(() => {
      setRestTimer(prev => {
        if (!prev) return null;
        const nextSec = prev.secondsLeft - 1;

        // Acoustic countdown cues
        if (nextSec === 3 || nextSec === 2 || nextSec === 1) {
          soundService.beepCountdown(); // 440 Hz
        } else if (nextSec <= 0) {
          soundService.beepGo(); // 880 Hz finish gong
          return null;
        }

        return { ...prev, secondsLeft: nextSec };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [restTimer?.active]);

  // DEDICATED INTERVAL CLOCK EFFECT (TABATA 20/10 & EMOM)
  useEffect(() => {
    if (!intervalModal || !intervalModal.open || !intervalModal.isRunning) return;

    const timer = setInterval(() => {
      setIntervalModal(prev => {
        if (!prev || !prev.isRunning) return prev;

        const nextSec = prev.secondsLeft - 1;

        // 3-2-1 Audio warnings
        if (nextSec === 3 || nextSec === 2 || nextSec === 1) {
          soundService.beepCountdown(); // 440 Hz
        }

        if (nextSec <= 0) {
          soundService.beepGo(); // 880 Hz transition

          if (prev.mode === 'tabata') {
            if (prev.phase === 'work') {
              // Switch to REST
              return {
                ...prev,
                phase: 'rest',
                secondsLeft: prev.restDuration
              };
            } else {
              // REST completed
              if (prev.currentRound < prev.totalRounds) {
                return {
                  ...prev,
                  phase: 'work',
                  currentRound: prev.currentRound + 1,
                  secondsLeft: prev.workDuration
                };
              } else {
                // TABATA FINISHED
                soundService.beepGo();
                return { ...prev, isRunning: false, secondsLeft: 0 };
              }
            }
          } else {
            // EMOM: Minute completed
            if (prev.currentRound < prev.totalRounds) {
              return {
                ...prev,
                currentRound: prev.currentRound + 1,
                secondsLeft: 60
              };
            } else {
              // EMOM FINISHED
              soundService.beepGo();
              return { ...prev, isRunning: false, secondsLeft: 0 };
            }
          }
        }

        return { ...prev, secondsLeft: nextSec };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [intervalModal?.open, intervalModal?.isRunning]);

  const handleLog = (ex: WorkoutExercise, row: TrackingRow) => {
    const isDone = progress.workoutLogs.some(l => l.exerciseId === row.exerciseId && l.setIndex === row.globalIndex);
    
    if (isDone) {
      // Untoggle set
      setProgress(p => ({
        ...p,
        workoutLogs: p.workoutLogs.filter(l => !(l.exerciseId === row.exerciseId && l.setIndex === row.globalIndex))
      }));
    } else {
      const manualW = progress.performanceData[row.exerciseId]?.weights[row.globalIndex];
      const manualR = progress.performanceData[row.exerciseId]?.reps[row.globalIndex];
      const ghost = ghostMap[row.exerciseId];
      const baseTargetKg = ghost?.weight || parseWeightValue(row.targetWeight);
      
      const hasManualW = manualW !== undefined && !isNaN(manualW) && manualW > 0;
      const finalWeight = hasManualW
        ? (displayUnit === 'lbs' ? Math.round((manualW / 2.20462) * 10) / 10 : manualW)
        : baseTargetKg;

      const visibleWeightValue = hasManualW
        ? manualW
        : (displayUnit === 'lbs' ? Math.round(baseTargetKg * 2.20462 * 10) / 10 : baseTargetKg);
      
      const finalReps = manualR !== undefined && !isNaN(manualR) && manualR > 0 
        ? manualR 
        : (ghost?.reps || parseWeightValue(row.targetReps));
      
      const currentExNote = exerciseNotes[row.exerciseId]?.trim();
      const log: WorkoutLog = {
        athleteId: user?.id,
        workoutId: workout.id,
        workoutName: workout.publicTitle || workout.name,
        exerciseId: row.exerciseId,
        setIndex: row.globalIndex,
        weight: finalWeight,
        reps: finalReps,
        timestamp: new Date().toISOString(),
        isPR: false,
        notes: currentExNote || undefined
      };

      // Sound feedback on completion + persist values visibly for easy review when going back
      soundService.beepCountdown();
      setProgress(p => {
        const exData = p.performanceData[row.exerciseId] || { weights: [], reps: [] };
        const nextWeights = [...(exData.weights || [])];
        const nextReps = [...(exData.reps || [])];
        if (!hasManualW && visibleWeightValue > 0) nextWeights[row.globalIndex] = visibleWeightValue;
        if ((manualR === undefined || isNaN(manualR) || manualR <= 0) && finalReps > 0) nextReps[row.globalIndex] = finalReps;
        return {
          ...p,
          performanceData: {
            ...p.performanceData,
            [row.exerciseId]: { weights: nextWeights, reps: nextReps }
          },
          workoutLogs: [...p.workoutLogs, log]
        };
      });

      // Determinar si corresponde iniciar descanso según método fisiológico
      let shouldRest = true;
      if (ex.method === 'biserie') {
        shouldRest = row.label.startsWith('B -');
      } else if (ex.method === 'triserie') {
        shouldRest = row.label.startsWith('C -');
      } else if (ex.method === 'giant_set') {
        const letters = ['C', 'D', 'E', 'F', 'G'];
        const lastLetter = letters[(ex.supersetChain?.length || 1) - 1] || 'B';
        shouldRest = row.label.startsWith(`${lastLetter} -`);
      }

      if (shouldRest) {
        const restTime = ex.targetRest !== undefined ? ex.targetRest : 90;
        if (restTime > 0) {
          soundService.beepRest();
          setRestTimer({
            active: true,
            secondsLeft: restTime,
            totalSeconds: restTime,
            exerciseName: ex.name
          });
        }
      }
    }
  };

  const updateInput = (exId: string, idx: number, field: 'weights' | 'reps', val: string) => {
    const parsed = parseFloat(val);
    setProgress(p => {
      const exData = p.performanceData[exId] || { weights: [], reps: [] };
      const newArr = [...(exData[field] || [])];
      newArr[idx] = parsed;
      // Si la serie ya estaba marcada como completada y el atleta vuelve atrás a corregirla, actualiza el registro en vivo
      const updatedLogs = p.workoutLogs.map(l => {
        if (l.exerciseId === exId && l.setIndex === idx) {
          if (field === 'weights') {
            const wKg = isNaN(parsed) ? 0 : (displayUnit === 'lbs' ? Math.round((parsed / 2.20462) * 10) / 10 : parsed);
            return { ...l, weight: wKg };
          }
          return { ...l, reps: isNaN(parsed) ? 0 : parsed };
        }
        return l;
      });
      return {
        ...p,
        performanceData: { ...p.performanceData, [exId]: { ...exData, [field]: newArr } },
        workoutLogs: updatedLogs
      };
    });
  };

  const handleFillPreviousSession = (exIdx: number, rows: TrackingRow[]) => {
    setProgress(p => {
      const nextPerf = { ...p.performanceData };
      let filledAny = false;
      rows.forEach(row => {
        const g = ghostMap[row.exerciseId];
        const refKg = g && (g.weight > 0 || g.reps > 0) ? g.weight : parseWeightValue(row.targetWeight);
        const refReps = g && g.reps > 0 ? g.reps : parseWeightValue(row.targetReps);
        const visibleWeight = displayUnit === 'lbs'
          ? Math.round(refKg * 2.20462 * 10) / 10
          : refKg;
        const exData = nextPerf[row.exerciseId] || { weights: [], reps: [] };
        const nextWeights = [...(exData.weights || [])];
        const nextReps = [...(exData.reps || [])];
        if (visibleWeight > 0) {
          nextWeights[row.globalIndex] = visibleWeight;
          filledAny = true;
        }
        if (refReps > 0) {
          nextReps[row.globalIndex] = refReps;
          filledAny = true;
        }
        nextPerf[row.exerciseId] = { weights: nextWeights, reps: nextReps };
      });
      return filledAny ? { ...p, performanceData: nextPerf } : p;
    });
    setCopiedPrevIdx(exIdx);
    setTimeout(() => setCopiedPrevIdx(prev => (prev === exIdx ? null : prev)), 2200);
  };

  const openIntervalClock = (ex: WorkoutExercise) => {
    const isTabata = ex.method === 'tabata';
    const totalUnits = isTabata ? (ex.tabataConfig?.rounds || 8) : (ex.emomConfig?.durationMin || 10);
    const workSec = isTabata ? (ex.tabataConfig?.workTimeSec || 20) : 60;
    const restSec = isTabata ? (ex.tabataConfig?.restTimeSec || 10) : 0;

    setIntervalModal({
      open: true,
      exercise: ex,
      mode: isTabata ? 'tabata' : 'emom',
      isRunning: false,
      phase: 'work',
      secondsLeft: workSec,
      currentRound: 1,
      totalRounds: totalUnits,
      workDuration: workSec,
      restDuration: restSec
    });
  };

  const completeAllIntervalRows = () => {
    if (!intervalModal) return;
    const ex = intervalModal.exercise;
    const rows = generateTrackingRows(ex);
    
    const newLogs: WorkoutLog[] = rows.map(r => ({
      athleteId: user?.id,
      workoutId: workout.id,
      workoutName: workout.publicTitle || workout.name,
      exerciseId: r.exerciseId,
      setIndex: r.globalIndex,
      weight: parseWeightValue(r.targetWeight),
      reps: parseWeightValue(r.targetReps) || 10,
      timestamp: new Date().toISOString(),
      isPR: false
    }));

    soundService.beepGo();
    setProgress(p => ({
      ...p,
      workoutLogs: [
        ...p.workoutLogs.filter(l => !rows.some(r => r.exerciseId === l.exerciseId && r.globalIndex === l.setIndex)),
        ...newLogs
      ]
    }));
    setIntervalModal(null);
  };

  const pendingExercises = useMemo(() => {
    return workout.exercises
      .map((ex, idx) => {
        const rows = generateTrackingRows(ex);
        const doneCount = progress.workoutLogs.filter(l => rows.some(r => r.exerciseId === l.exerciseId && r.globalIndex === l.setIndex)).length;
        return { idx, name: ex.name, doneCount, total: rows.length };
      })
      .filter(item => item.doneCount < item.total);
  }, [workout.exercises, progress.workoutLogs]);

  const handleCompleteRequest = async () => {
    setShowFeedback(true);
  };

  const generateDebrief = () => {
    const setsCount = progress.workoutLogs.length;
    const tonnageKg = Math.round(currentTonnage);
    const recoveryTip = feedback.rpe >= 8
      ? 'Carga exigente: prioriza 8h de sueño, hidratación con electrolitos e ingesta proteica post-entreno.'
      : 'Carga controlada y eficiente: mantén buena hidratación y movilidad ligera para asimilar la sesión.';
    setAiDebrief(
      `RESUMEN KINETIX (Cierre Seguro)\n• Series completadas: ${setsCount}\n• Tonelaje acumulado: ${tonnageKg.toLocaleString()} kg\n• Esfuerzo reportado: RPE ${feedback.rpe}/10 · Fatiga ${feedback.fatigue}/5\n\nDirectriz Lic. Jorge González: ${recoveryTip}`
    );
  };

  const folioCode = `KFX-JG-${(user?.id || 'ATLETA').slice(-4).toUpperCase()}-${new Date().toISOString().slice(5, 10).replace('-', '')}`;
  const forensicStamp = `🔒 PROPIEDAD INTELECTUAL KINETIX • LIC. JORGE GONZÁLEZ • ${(user?.name || 'ATLETA').toUpperCase()} • FOLIO ${folioCode} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const activeIdx = expandedIdx !== null ? expandedIdx : 0;

  return (
    <div 
      className="min-h-screen bg-[#050507] text-white pb-40 relative overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
      {/* ESCUDO ANTICAPTURA / PRIVACIDAD AL SALIR DE LA VENTANA */}
      {privacyShield && (
        <div className="fixed inset-0 z-[200] bg-[#050507]/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="max-w-sm w-full bg-[#0F0F11] border border-red-500/40 rounded-3xl p-7 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-2xl">🔒</div>
            <h2 className="text-lg font-black uppercase italic text-white">Sesión Protegida Kinetix</h2>
            <p className="text-xs text-white/60 leading-relaxed">
              Metodología exclusiva de <strong className="text-white">Lic. Jorge González</strong>. Folio activo: <span className="font-mono text-cyan-400">{folioCode}</span>.
            </p>
            <button
              type="button"
              onClick={() => setPrivacyShield(false)}
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-all"
            >
              Continuar Entrenamiento →
            </button>
          </div>
        </div>
      )}

      {/* CAPA FORENSE ANTICAPTURA VISIBLE (PROPIEDAD INTELECTUAL) */}
      <div className="fixed inset-0 pointer-events-none z-30 opacity-[0.06] overflow-hidden select-none flex flex-col justify-around rotate-[-20deg] scale-125">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className={`whitespace-nowrap text-[10px] font-mono font-black tracking-[0.22em] text-center ${idx % 2 === 0 ? 'text-white' : 'text-red-500'}`}>
            {forensicStamp}
          </div>
        ))}
      </div>
      
      {/* TOP BAR / HUD */}
      <div className="sticky top-0 z-50 bg-[#050507]/95 backdrop-blur-xl border-b border-white/10">
        <div className="p-3 md:px-8 flex justify-between items-center gap-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            {onExit && (
              <button
                type="button"
                onClick={() => progress.workoutLogs.length > 0 ? setConfirmExit(true) : onExit()}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white/80 shrink-0"
              >
                ← Regresar
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[11px] font-black uppercase text-red-500 tracking-wider leading-snug break-words">
                  {workout.publicTitle || workout.name}
                </h1>
                {progress.workoutLogs.length > 0 && (
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[8px] font-black uppercase text-emerald-300 shrink-0">
                    ✓ {progress.workoutLogs.length} guardadas
                  </span>
                )}
              </div>
              <p className="text-xl font-black italic tracking-tighter leading-none tabular-nums">
                {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
              </p>
            </div>

            {currentTonnage > 0 && (
              <div className="hidden sm:flex flex-col bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-center shrink-0">
                <span className="text-[8px] font-black uppercase tracking-wider text-cyan-400">Tonelaje</span>
                <span className="text-xs font-black text-white tabular-nums">
                  {currentTonnage.toLocaleString()} KG
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-black/70 p-0.5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setDisplayUnit('kg')}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${displayUnit === 'kg' ? 'bg-red-600 text-white' : 'text-white/50 hover:text-white'}`}
              >
                KG
              </button>
              <button
                type="button"
                onClick={() => setDisplayUnit('lbs')}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all ${displayUnit === 'lbs' ? 'bg-cyan-500 text-black' : 'text-white/50 hover:text-white'}`}
              >
                LBS
              </button>
            </div>

            <button 
              type="button"
              onClick={() => setShowConverter(true)} 
              className="px-2.5 py-2 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-white/80 hover:text-white transition-all flex items-center gap-1"
              title="Abrir Conversor de Cargas KG ⇄ LBS"
            >
              <span>⚖️</span>
              <span className="hidden sm:inline">Calc</span>
            </button>

            <button 
              onClick={handleCompleteRequest} 
              className="px-4 py-2 bg-red-600 hover:bg-red-500 active:scale-95 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all shrink-0"
            >
              Finalizar
            </button>
          </div>
        </div>

        {/* BARRA DE NAVEGACIÓN RÁPIDA ENTRE EJERCICIOS (TIPO SMART FIT / HEVY) */}
        <div className="max-w-4xl mx-auto px-3 md:px-8 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {workout.exercises.map((ex, idx) => {
            const exRows = generateTrackingRows(ex);
            const doneCount = progress.workoutLogs.filter(l => exRows.some(r => r.exerciseId === l.exerciseId && r.globalIndex === l.setIndex)).length;
            const isComplete = doneCount >= exRows.length && exRows.length > 0;
            const isCurrent = expandedIdx === idx;
            return (
              <button
                key={`${ex.exerciseId}-${idx}`}
                type="button"
                onClick={() => goToExercise(idx)}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  isCurrent
                    ? 'bg-red-600 text-white shadow-md'
                    : isComplete
                    ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                <span className="tabular-nums">{isComplete ? '✓' : `${idx + 1}.`}</span>
                <span>{ex.name}</span>
              </button>
            );
          })}
        </div>

        {confirmExit && onExit && (
          <div className="bg-[#121216] border-t border-amber-500/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3 max-w-4xl mx-auto">
            <span className="text-xs font-bold text-amber-100">
              Tus {progress.workoutLogs.length} serie(s) quedan en borrador local. Para cerrar y bloquear la sesión en todos tus dispositivos usa "Finalizar".
            </span>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button type="button" onClick={() => setConfirmExit(false)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white">
                ← Seguir
              </button>
              <button type="button" onClick={() => { setConfirmExit(false); setShowFeedback(true); }} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white">
                Finalizar ✓
              </button>
              <button type="button" onClick={onExit} className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-xs font-bold text-white">
                Salir sin cerrar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* EXERCISES LIST */}
      <div className="relative z-20 p-4 space-y-4 max-w-2xl mx-auto">
        {workout.exercises.map((ex, i) => {
          const rows = generateTrackingRows(ex);
          const isExpanded = expandedIdx === i;
          const completedCount = progress.workoutLogs.filter(l => rows.some(r => r.exerciseId === l.exerciseId && r.globalIndex === l.setIndex)).length;
          const isAllDone = completedCount >= rows.length && rows.length > 0;
          const ghost = ghostMap[ex.exerciseId];
          const dbEx = EXERCISES_DB.find(e => e.id === ex.exerciseId);

          return (
            <div 
              id={`kinetix-ex-${i}`}
              key={i} 
              className={`rounded-[32px] border transition-all scroll-mt-32 ${
                isExpanded 
                  ? 'bg-[#121215] border-white/20 shadow-2xl scale-[1.01]' 
                  : isAllDone 
                  ? 'bg-black/60 opacity-75 border-green-900/40' 
                  : 'bg-[#0F0F11] border-white/5'
              }`}
            >
              {/* HEADER EXERCISE ROW */}
              <div 
                onClick={() => goToExercise(isExpanded ? null : i)} 
                className="p-6 flex justify-between items-center cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-colors ${
                    isAllDone ? 'bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.4)] text-white' : 'bg-white/5 text-white/50'
                  }`}>
                    {isAllDone ? '✓' : i + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase italic tracking-tight">{ex.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-white/30 uppercase font-bold">
                        {completedCount}/{rows.length} Sets
                      </span>
                      {ex.method && ex.method !== 'standard' && (
                        <span className="text-[8px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded uppercase font-black">
                          {ex.method}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`text-white/40 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </div>

              {/* EXPANDED CONTENT */}
              {isExpanded && (
                <div className="p-5 border-t border-white/5 space-y-4 bg-black/30">
                  
                  {/* SPORTS SCIENCE BADGES */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ex.targetRir && (
                      <span className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-[8px] font-black text-yellow-400 uppercase">
                        🎯 RIR: {ex.targetRir}
                      </span>
                    )}
                    {ex.tempo && (
                      <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-[8px] font-black text-cyan-400 uppercase">
                        ⏱ TEMPO: {ex.tempo}
                      </span>
                    )}
                    {ex.intensityPercent && (
                      <span className="px-2.5 py-1 bg-pink-500/10 border border-pink-500/30 rounded-lg text-[8px] font-black text-pink-400 uppercase">
                        ⚡ INTENSIDAD: {ex.intensityPercent}
                      </span>
                    )}
                    {ex.targetRest !== undefined && ex.targetRest > 0 && (
                      <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded-lg text-[8px] font-black text-red-400 uppercase">
                        🛑 DESCANSO: {ex.targetRest}s
                      </span>
                    )}
                    {ex.setType && ex.setType !== 'straight' && (
                      <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg text-[8px] font-black text-amber-300 uppercase">
                        👑 {ex.setType === 'custom'
                          ? (ex.customSetType?.trim() || 'Protocolo Coach')
                          : ex.setType === 'eccentric'
                          ? 'Excéntrica (Negativa)'
                          : ex.setType === 'concentric'
                          ? 'Concéntrica (Explosiva)'
                          : ex.setType === 'isometric'
                          ? 'Isométrica (Pausa)'
                          : ex.setType.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* DEDICATED INTERVAL CLOCK LAUNCHER (TABATA / EMOM) */}
                  {(ex.method === 'tabata' || ex.method === 'emom') && (
                    <button
                      onClick={() => openIntervalClock(ex)}
                      className="w-full py-3.5 bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:opacity-90 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-2"
                    >
                      <span>⏱️ ABRIR RELOJ {ex.method.toUpperCase()}</span>
                      <span className="text-[7px] bg-black/40 px-2 py-0.5 rounded font-mono">
                        {ex.method === 'tabata' ? '20s WORK / 10s REST' : '1 MIN POR RONDA'}
                      </span>
                    </button>
                  )}

                  {/* DIRECTRIZ AUTOMÁTICA DEL COACH (100% SIN IA · 0 TOKENS) */}
                  <div className="bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-2xl text-[11px] text-red-300 font-bold tracking-wide flex items-start gap-2.5">
                    <span className="shrink-0">💡</span>
                    <div className="space-y-1">
                      <span className="font-black text-white/60 text-[9px] uppercase tracking-widest block">Directriz del Coach · Lic. Jorge González</span>
                      <span className="normal-case text-white/85 font-semibold leading-snug block">{getSmartCoachDirective(ex, dbEx)}</span>
                      {user?.coachNote?.trim() && (
                        <span className="normal-case text-cyan-300 font-semibold leading-snug block pt-1 border-t border-white/10">
                          Nota personal: {user.coachNote.trim()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BIOMECHANICAL CHECKLIST */}
                  {dbEx?.technique && (
                    <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl space-y-1">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Patrón Biomecánico</p>
                      <p className="text-xs text-white/70 font-medium italic">{dbEx.technique}</p>
                    </div>
                  )}

                  {/* BOTÓN 1-TOQUE: IGUAL QUE LA SESIÓN ANTERIOR */}
                  {(() => {
                    const hasAnyGhost = rows.some(r => !!ghostMap[r.exerciseId]);
                    const hasAnyTarget = rows.some(r => parseWeightValue(r.targetWeight) > 0 || parseWeightValue(r.targetReps) > 0);
                    if (!hasAnyGhost && !hasAnyTarget) return null;
                    const primaryGhost = ghostMap[ex.exerciseId];
                    const hintText = primaryGhost
                      ? `${displayUnit === 'lbs' ? Math.round(primaryGhost.weight * 2.20462 * 10) / 10 : primaryGhost.weight} ${displayUnit} × ${primaryGhost.reps}`
                      : '';
                    return (
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleFillPreviousSession(i, rows)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/35 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                          <span>↺</span>
                          <span>
                            {copiedPrevIdx === i
                              ? '✓ Series rellenadas'
                              : hasAnyGhost
                              ? `Igual que la sesión anterior${hintText ? ` (${hintText})` : ''}`
                              : 'Cargar pesos y reps objetivo'}
                          </span>
                        </button>
                      </div>
                    );
                  })()}

                  {(() => {
                    const renderTrackingRow = (row: TrackingRow, rKey: string | number) => {
                      const log = progress.workoutLogs.find(l => l.exerciseId === row.exerciseId && l.setIndex === row.globalIndex);
                      const rowGhost = ghostMap[row.exerciseId];
                      return (
                        <div 
                          key={rKey} 
                          className={`flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all ${
                            log ? 'bg-green-600/10 border-green-500/30' : 'bg-black/60 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className="w-16 sm:w-24 text-center shrink-0">
                            <p className="text-[10px] font-black text-white/75 uppercase leading-tight">{row.label}</p>
                            {row.exerciseName && (
                              <p className="text-[8px] font-bold text-cyan-300/75 uppercase mt-0.5 break-words leading-tight">{row.exerciseName}</p>
                            )}
                          </div>
                          
                          <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
                            <div className="min-w-0">
                              <div className="flex justify-between items-center gap-1 mb-0.5">
                                <span className="text-[9px] text-white/50 uppercase font-black">{displayUnit.toUpperCase()}</span>
                                {(() => {
                                  const enteredVal = progress.performanceData[row.exerciseId]?.weights[row.globalIndex];
                                  if (enteredVal && enteredVal > 0) {
                                    return (
                                      <span className="text-[8px] text-cyan-400 font-mono font-bold truncate">
                                        {getWeightEquivalenceHint(enteredVal, displayUnit)}
                                      </span>
                                    );
                                  }
                                  const refKg = rowGhost ? rowGhost.weight : parseWeightValue(row.targetWeight);
                                  return refKg > 0 ? (
                                    <span className="text-[8px] text-cyan-400/75 font-mono font-bold truncate">
                                      {getWeightEquivalenceHint(refKg, 'kg')}
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                              <input 
                                type="number" 
                                inputMode="decimal"
                                step="any"
                                placeholder={(() => {
                                  const refKg = rowGhost ? rowGhost.weight : parseWeightValue(row.targetWeight);
                                  if (!refKg) return '0';
                                  return displayUnit === 'lbs'
                                    ? `${Math.round(refKg * 2.20462 * 10) / 10}`
                                    : `${refKg}`;
                                })()} 
                                className={`w-full bg-white/[0.04] rounded-xl px-2.5 py-2 text-base font-black text-white outline-none border border-white/10 focus:border-red-500 transition-colors ${
                                  rowGhost ? 'placeholder-white/45' : 'placeholder-white/20'
                                }`} 
                                value={(() => {
                                  const v = progress.performanceData[row.exerciseId]?.weights[row.globalIndex];
                                  return v !== undefined && !isNaN(v) ? v : '';
                                })()} 
                                onChange={e => updateInput(row.exerciseId, row.globalIndex, 'weights', e.target.value)} 
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9px] text-white/50 uppercase font-black block mb-0.5 text-center">REPS</span>
                              <input 
                                type="number" 
                                inputMode="numeric"
                                placeholder={rowGhost && rowGhost.reps > 0 ? `${rowGhost.reps}` : row.targetReps} 
                                className={`w-full bg-white/[0.04] rounded-xl px-2 py-2 text-base font-black text-white outline-none border border-white/10 text-center focus:border-red-500 transition-colors ${
                                  rowGhost ? 'placeholder-white/45' : 'placeholder-white/20'
                                }`} 
                                value={progress.performanceData[row.exerciseId]?.reps[row.globalIndex] || ''} 
                                onChange={e => updateInput(row.exerciseId, row.globalIndex, 'reps', e.target.value)} 
                              />
                            </div>
                          </div>

                          <button 
                            type="button"
                            onClick={() => handleLog(ex, row)} 
                            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                              log ? 'bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-95' : 'bg-white/10 hover:bg-white/20 active:scale-90'
                            }`}
                          >
                            {log ? <span className="text-white font-black text-base">✓</span> : <span className="text-[10px] font-black text-white/70">OK</span>}
                          </button>
                        </div>
                      );
                    };

                    const isMultiExerciseBlock = ['biserie', 'triserie', 'giant_set'].includes(ex.method || '') && !!ex.pair;

                    if (isMultiExerciseBlock && ex.pair) {
                      const rowsA = rows.filter(r => r.label.startsWith('A -'));
                      const rowsB = rows.filter(r => r.label.startsWith('B -'));
                      const chainItems = ex.supersetChain || [];
                      const chainLetters = ['C', 'D', 'E', 'F', 'G'];

                      return (
                        <div className="space-y-5 pt-1">
                          <div className="bg-blue-950/25 border border-blue-500/30 rounded-2xl px-3.5 py-2 text-[10px] font-bold text-blue-200 flex items-center gap-2">
                            <span>🔁</span>
                            <span>
                              Alterna A → B{chainItems.length > 0 ? ` → ${chainLetters.slice(0, chainItems.length).join(' → ')}` : ''} por ronda. Sus pesos y series están organizados debajo de cada video.
                            </span>
                          </div>

                          {/* BLOQUE A: VIDEO + SERIES DE A */}
                          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-4 space-y-3">
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                              Bloque A · {ex.name}
                            </p>
                            {ex.videoUrl && (
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Demostración Técnica A 🎥</p>
                                  <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="text-[8px] text-red-400 hover:text-white uppercase font-bold">
                                    Abrir en YouTube ↗
                                  </a>
                                </div>
                                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-xl">
                                  <iframe 
                                    className="absolute inset-0 w-full h-full" 
                                    src={getYoutubeEmbedUrl(ex.videoUrl)} 
                                    title={ex.name} 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                  />
                                </div>
                              </div>
                            )}
                            <div className="space-y-2">
                              {rowsA.map((row, idx) => renderTrackingRow(row, `A-${idx}`))}
                            </div>
                          </div>

                          {/* BLOQUE B: VIDEO + SERIES DE B */}
                          <div className="bg-blue-950/15 border border-blue-500/25 rounded-3xl p-4 space-y-3">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                              Bloque B · {ex.pair.name}
                            </p>
                            {ex.pair.videoUrl && (
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <p className="text-[8px] font-black text-blue-300/70 uppercase tracking-widest">Demostración Técnica B 🎥</p>
                                  <a href={ex.pair.videoUrl} target="_blank" rel="noreferrer" className="text-[8px] text-blue-400 hover:text-white uppercase font-bold">
                                    Abrir en YouTube ↗
                                  </a>
                                </div>
                                <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-xl">
                                  <iframe 
                                    className="absolute inset-0 w-full h-full" 
                                    src={getYoutubeEmbedUrl(ex.pair.videoUrl)} 
                                    title={ex.pair.name} 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                  />
                                </div>
                              </div>
                            )}
                            <div className="space-y-2">
                              {rowsB.map((row, idx) => renderTrackingRow(row, `B-${idx}`))}
                            </div>
                          </div>

                          {/* BLOQUES C, D, ... (TRISERIE / SERIE GIGANTE) */}
                          {chainItems.map((sub, sIdx) => {
                            const letter = chainLetters[sIdx] || `+${sIdx + 1}`;
                            const letterRows = rows.filter(r => r.label.startsWith(`${letter} -`));
                            if (letterRows.length === 0) return null;
                            return (
                              <div key={sIdx} className="bg-indigo-950/15 border border-indigo-500/25 rounded-3xl p-4 space-y-3">
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                                  Bloque {letter} · {sub.name}
                                </p>
                                {sub.videoUrl && (
                                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-xl">
                                    <iframe 
                                      className="absolute inset-0 w-full h-full" 
                                      src={getYoutubeEmbedUrl(sub.videoUrl)} 
                                      title={sub.name} 
                                      frameBorder="0" 
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                      allowFullScreen
                                    />
                                  </div>
                                )}
                                <div className="space-y-2">
                                  {letterRows.map((row, idx) => renderTrackingRow(row, `${letter}-${idx}`))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    return (
                      <>
                        {ex.videoUrl && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Demostración Técnica 🎥</p>
                              <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="text-[8px] text-red-400 hover:text-white uppercase font-bold">
                                Abrir en YouTube ↗
                              </a>
                            </div>
                            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black shadow-xl">
                              <iframe 
                                className="absolute inset-0 w-full h-full" 
                                src={getYoutubeEmbedUrl(ex.videoUrl)} 
                                title={ex.name} 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-2.5 pt-1">
                          {rows.map((row, rIdx) => renderTrackingRow(row, rIdx))}
                        </div>
                      </>
                    );
                  })()}

                  {/* NOTAS RÁPIDAS DEL ATLETA POR EJERCICIO (SIN IA · 0 TOKENS · SUPABASE) */}
                  <QuickNotes
                    exerciseId={ex.exerciseId}
                    exerciseName={ex.name}
                    value={exerciseNotes[ex.exerciseId] ?? ''}
                    previousNote={previousNoteMap[ex.exerciseId]}
                    onChange={note => handleExerciseNoteChange(ex.exerciseId, note)}
                    onSaveToCloud={note => handleSaveExerciseNoteToCloud(ex.exerciseId, note)}
                  />

                  {/* NAVEGACIÓN ENTRE EJERCICIOS ANTERIOR / SIGUIENTE */}
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => goToExercise(i - 1)}
                      className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-black uppercase tracking-wider text-white transition-all"
                    >
                      ← Anterior
                    </button>
                    <span className="text-[11px] font-bold text-white/50 tabular-nums">
                      Ejercicio {i + 1} de {workout.exercises.length}
                    </span>
                    {i < workout.exercises.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => goToExercise(i + 1)}
                        className="px-4 py-3 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-black uppercase tracking-wider transition-all"
                      >
                        Siguiente →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCompleteRequest}
                        className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-all"
                      >
                        Terminar ✓
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* MARCA DE AGUA Y PROTECCIÓN DE PROPIEDAD INTELECTUAL VISIBLE */}
        <div className="bg-[#0A0A0D] border border-white/10 rounded-2xl p-4 text-center space-y-1 select-none pointer-events-none">
          <p className="text-[11px] font-black uppercase tracking-wider text-white/80">
            🔒 Propiedad Intelectual Kinetix Functional Zone • Lic. Jorge González
          </p>
          <p className="text-[10px] text-white/50">
            Metodología Exclusiva Lic. Jorge González · Folio {folioCode} · {user?.name || 'Atleta'} · Prohibida su copia
          </p>
        </div>
      </div>

      {/* BARRA INFERIOR FIJA DE NAVEGACIÓN ENTRE EJERCICIOS (SIEMPRE ACCESIBLE) */}
      {workout.exercises.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0D]/95 backdrop-blur-xl border-t border-white/10 px-3 py-2.5">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={activeIdx <= 0}
              onClick={() => goToExercise(Math.max(0, activeIdx - 1))}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-black uppercase tracking-wider text-white transition-all shrink-0"
            >
              ← Anterior
            </button>

            <button
              type="button"
              onClick={() => goToExercise(activeIdx)}
              className="px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-center min-w-0 flex-1"
            >
              <span className="text-[10px] font-black uppercase text-cyan-400 block truncate">
                Ej. {activeIdx + 1}/{workout.exercises.length} · {workout.exercises[activeIdx]?.name}
              </span>
              <span className="text-[9px] text-white/50">Toca Anterior para corregir series previas</span>
            </button>

            {activeIdx < workout.exercises.length - 1 ? (
              <button
                type="button"
                onClick={() => goToExercise(activeIdx + 1)}
                className="px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition-all shrink-0 shadow-lg"
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteRequest}
                className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-all shrink-0 shadow-lg"
              >
                Ok · Finalizar ✓
              </button>
            )}
          </div>
        </div>
      )}

      {/* FLOATING TACTICAL REST TIMER BAR */}
      {restTimer && restTimer.active && (
        <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-50 bg-[#0F0F11]/95 backdrop-blur-2xl border border-red-600/40 p-4 rounded-3xl shadow-[0_10px_40px_rgba(255,0,0,0.25)] animate-in slide-in-from-bottom-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/10" />
                  <circle 
                    cx="24" 
                    cy="24" 
                    r="20" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    fill="transparent" 
                    className="text-red-600 transition-all duration-1000"
                    strokeDasharray={125.6} 
                    strokeDashoffset={125.6 - (125.6 * restTimer.secondsLeft) / restTimer.totalSeconds} 
                    strokeLinecap="round" 
                  />
                </svg>
                <span className="absolute font-black text-sm text-white italic">{restTimer.secondsLeft}s</span>
              </div>
              <div>
                <p className="text-[7px] font-black uppercase text-red-500 tracking-widest">Recuperación Acústica</p>
                <p className="text-xs font-black uppercase text-white truncate max-w-[130px]">{restTimer.exerciseName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setRestTimer(p => p ? { ...p, secondsLeft: p.secondsLeft + 30, totalSeconds: p.totalSeconds + 30 } : null)}
                className="px-2.5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black uppercase text-white/80"
              >
                +30s
              </button>
              <button 
                onClick={() => setRestTimer(p => p ? { ...p, secondsLeft: Math.max(1, p.secondsLeft - 15) } : null)}
                className="px-2.5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black uppercase text-white/80"
              >
                -15s
              </button>
              <button 
                onClick={() => {
                  soundService.beepGo();
                  setRestTimer(null);
                }}
                className="px-3 py-2 bg-red-600 text-white rounded-xl text-[8px] font-black uppercase tracking-wider"
              >
                Saltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERVAL TIMER MODAL (TABATA / EMOM) */}
      {intervalModal && intervalModal.open && (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95">
          <div className="bg-[#121215] w-full max-w-sm rounded-[36px] border border-red-600/30 p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
            {/* Background ambient glow */}
            <div className={`absolute inset-0 blur-[90px] pointer-events-none transition-colors duration-1000 ${
              intervalModal.phase === 'work' ? 'bg-red-600/15' : 'bg-cyan-500/15'
            }`} />

            <div className="relative z-10 flex justify-between items-center">
              <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">
                Protocolo {intervalModal.mode.toUpperCase()}
              </span>
              <button 
                onClick={() => setIntervalModal(null)} 
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 text-white text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="relative z-10">
              <h2 className="text-lg font-black uppercase italic tracking-tight">{intervalModal.exercise.name}</h2>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1">
                Ronda {intervalModal.currentRound} de {intervalModal.totalRounds}
              </p>
            </div>

            {/* BIG INTERVAL CLOCK */}
            <div className="relative z-10 my-4 flex flex-col items-center justify-center">
              <div className={`w-44 h-44 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-700 shadow-2xl ${
                intervalModal.phase === 'work' 
                  ? 'border-red-600 bg-red-950/20 shadow-[0_0_50px_rgba(255,0,0,0.3)]' 
                  : 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_50px_rgba(6,182,212,0.3)]'
              }`}>
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${
                  intervalModal.phase === 'work' ? 'text-red-500' : 'text-cyan-400'
                }`}>
                  {intervalModal.phase === 'work' ? 'TRABAJO' : 'DESCANSO'}
                </span>
                <span className="text-6xl font-black italic tracking-tighter text-white">
                  {intervalModal.secondsLeft}
                </span>
                <span className="text-[8px] font-black text-white/30 uppercase mt-1">SEGUNDOS</span>
              </div>
            </div>

            {/* CONTROLS */}
            <div className="relative z-10 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setIntervalModal(p => p ? { ...p, isRunning: !p.isRunning } : null)}
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    intervalModal.isRunning 
                      ? 'bg-yellow-500 text-black hover:bg-yellow-400' 
                      : 'bg-red-600 text-white hover:bg-red-500 shadow-lg'
                  }`}
                >
                  {intervalModal.isRunning ? 'Pausar ⏸' : 'Iniciar Reloj ▶'}
                </button>
                <button
                  onClick={() => setIntervalModal(p => p ? { 
                    ...p, 
                    isRunning: false, 
                    phase: 'work', 
                    currentRound: 1, 
                    secondsLeft: p.workDuration 
                  } : null)}
                  className="px-5 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60"
                >
                  ↺
                </button>
              </div>

              <button
                onClick={completeAllIntervalRows}
                className="w-full py-3.5 bg-green-600/20 border border-green-500/30 hover:bg-green-600 text-green-400 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Marcar Todo el Bloque como Completado ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK & MISSION DEBRIEF MODAL */}
      {showFeedback && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 md:p-6 animate-in zoom-in-95">
          <div className="bg-[#121215] w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[36px] border border-white/10 p-6 md:p-8 shadow-2xl space-y-6 relative">
            {!aiDebrief && (
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">Reporte de Sesión</h2>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.25em] mt-1">Información vital para el Coach</p>
                </div>

                {pendingExercises.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-black text-amber-300 uppercase">
                      ⚠️ Aún tienes {pendingExercises.length} ejercicio(s) con series pendientes:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {pendingExercises.map(pe => (
                        <button
                          key={pe.idx}
                          type="button"
                          onClick={() => { setShowFeedback(false); goToExercise(pe.idx); }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-black text-[10px] font-bold transition-all"
                        >
                          Ir a: {pe.name} ({pe.doneCount}/{pe.total})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Esfuerzo Percibido (RPE)</label>
                      <span className="text-xl font-black text-red-600 italic">@{feedback.rpe}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={feedback.rpe} 
                      onChange={e => setFeedback({...feedback, rpe: parseInt(e.target.value)})} 
                      className="w-full accent-red-600" 
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Nivel de Fatiga Post-Op</p>
                    <div className="flex justify-between gap-2">
                      {[1,2,3,4,5].map(v => (
                        <button 
                          key={v} 
                          onClick={() => setFeedback({...feedback, fatigue: v})} 
                          className={`flex-1 h-12 rounded-xl font-black text-xs transition-all ${
                            feedback.fatigue === v ? 'bg-white text-black scale-110 shadow-lg' : 'bg-white/5 text-white/20 hover:bg-white/10'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Notas para tu Coach</label>
                    <textarea 
                      className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-medium text-white/80 outline-none focus:border-red-600 h-20" 
                      placeholder="Ej: Molestia en hombro, muy buen agarre..." 
                      value={feedback.notes} 
                      onChange={e => setFeedback({...feedback, notes: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button 
                    type="button"
                    onClick={generateDebrief}
                    className="w-full py-5 bg-red-600 rounded-[22px] text-white font-black uppercase tracking-[0.25em] text-[10px] shadow-xl hover:bg-red-500 transition-all active:scale-95"
                  >
                    FINALIZAR Y GUARDAR SESIÓN ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeedback(false)}
                    className="w-full py-3.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white/80 font-black uppercase tracking-wider text-[10px] transition-all"
                  >
                    ← Regresar a Mis Ejercicios
                  </button>
                </div>
              </>
            )}

            {aiDebrief && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_cyan]" />
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">Resumen Kinetix</h2>
                </div>
                
                <div className="bg-black/50 border border-white/5 p-6 rounded-3xl">
                  <p className="text-xs font-medium leading-relaxed text-white/85 whitespace-pre-wrap">
                    {aiDebrief}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[8px] font-black text-white/30 uppercase">Volumen</p>
                    <p className="text-lg font-black text-white italic">{progress.workoutLogs.length} series</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[8px] font-black text-white/30 uppercase">RPE Final</p>
                    <p className="text-lg font-black text-red-500 italic">@{feedback.rpe}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button 
                    type="button"
                    disabled={isClosingSession}
                    onClick={async () => {
                      if (isClosingSession) return;
                      setIsClosingSession(true);
                      try {
                        localStorage.removeItem(draftKey);
                      } catch {}
                      const updatedLogs = progress.workoutLogs.map(log => ({ 
                        ...log, 
                        athleteId: user?.id,
                        workoutId: workout.id,
                        workoutName: workout.publicTitle || workout.name,
                        notes: exerciseNotes[log.exerciseId]?.trim() || log.notes,
                        feedback 
                      }));
                      await onFinish({ ...progress, workoutLogs: updatedLogs, sessionFeedback: feedback });
                      setIsClosingSession(false);
                    }} 
                    className="w-full py-5 bg-white text-black rounded-[22px] font-black uppercase tracking-[0.25em] text-[10px] shadow-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isClosingSession ? 'SINCRONIZANDO Y BLOQUEANDO...' : 'CERRAR Y BLOQUEAR SESIÓN ✓'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiDebrief(null); setShowFeedback(false); }}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white/75 font-black uppercase tracking-wider text-[10px] transition-all"
                  >
                    ← Regresar a corregir series
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONVERSOR INTERACTIVO KG ⇄ LBS */}
      <UnitConverterModal 
        isOpen={showConverter} 
        onClose={() => setShowConverter(false)} 
        initialValue={40} 
      />
    </div>
  );
};
