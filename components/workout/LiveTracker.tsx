import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Workout, ProgressState, WorkoutLog, WorkoutExercise, SessionFeedback } from '../../types/kinetix';
import { soundService } from '../../services/soundService';
import { storageService } from '../../services/storageService';
import { aiService } from '../../services/aiService';
import { EXERCISES_DB } from '../../constants/exercises';
import { getYoutubeEmbedUrl } from '../../lib/youtube';

interface Props {
  workout: Workout;
  onFinish: (data: ProgressState) => void;
  user?: any;
}

const parseWeightValue = (input: string | undefined): number => {
  if (!input) return 0;
  const clean = input.toString().replace(/,/g, '.').replace(/[^0-9.]/g, ''); 
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
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

export const LiveTracker: React.FC<Props> = ({ workout, onFinish, user }) => {
  const [progress, setProgress] = useState<ProgressState>({
    currentExerciseIndex: 0,
    completedSets: 0,
    isPairTurn: false,
    subIndex: 0,
    performanceData: {},
    workoutLogs: [],
    emomCurrentMin: 1,
    tabataCurrentRound: 1,
    tabataCurrentSet: 1
  });

  const [expandedId, setExpandedId] = useState<string | null>(workout.exercises[0]?.exerciseId || null);
  const [elapsed, setElapsed] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<SessionFeedback>({ rpe: 7, fatigue: 3, notes: '' });
  const [aiDebrief, setAiDebrief] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

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

  const ghostMap = useMemo(() => {
    const map: Record<string, { weight: number, reps: number }> = {};
    workout.exercises.forEach(ex => {
      const last = storageService.getLastPerformance(ex.exerciseId);
      if (last) map[ex.exerciseId] = last;
    });
    return map;
  }, [workout]);

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
      
      const finalWeight = manualW !== undefined && manualW > 0 
        ? manualW 
        : (ghost?.weight || parseWeightValue(row.targetWeight));
      
      const finalReps = manualR !== undefined && manualR > 0 
        ? manualR 
        : (ghost?.reps || parseWeightValue(row.targetReps));
      
      const log: WorkoutLog = {
        exerciseId: row.exerciseId,
        setIndex: row.globalIndex,
        weight: finalWeight,
        reps: finalReps,
        timestamp: new Date().toISOString(),
        isPR: false
      };

      // Sound feedback on completion
      soundService.beepCountdown();
      setProgress(p => ({ ...p, workoutLogs: [...p.workoutLogs, log] }));

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
    setProgress(p => {
      const exData = p.performanceData[exId] || { weights: [], reps: [] };
      const newArr = [...(exData[field] || [])];
      newArr[idx] = parseFloat(val);
      return { ...p, performanceData: { ...p.performanceData, [exId]: { ...exData, [field]: newArr } } };
    });
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

  const handleCompleteRequest = async () => {
    setShowFeedback(true);
  };

  const generateDebrief = async () => {
    if (!aiService.isConfigured) {
      setAiDebrief("Misión completada con éxito. Datos biométricos y tonelaje guardados localmente.");
      return;
    }
    setIsAiProcessing(true);
    const summary = progress.workoutLogs.map(l => `${l.exerciseId}: ${l.reps} reps @ ${l.weight}kg`).join(', ');
    const query = `Analiza este entrenamiento táctico: ${summary}. Atleta reportó RPE ${feedback.rpe} y fatiga ${feedback.fatigue}. Da un debrief conciso estilo militar sobre el rendimiento, tonelaje alcanzado y una directriz de recuperación.`;
    const response = await aiService.getTechnicalAdvice(query);
    setAiDebrief(response);
    setIsAiProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white pb-36">
      
      {/* TOP BAR / HUD */}
      <div className="sticky top-0 z-50 bg-[#050507]/90 backdrop-blur-xl p-5 border-b border-white/5 flex justify-between items-center px-6 md:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
            <h1 className="text-[10px] font-black uppercase text-red-500 tracking-[0.3em] truncate max-w-[200px]">
              {workout.publicTitle || workout.name}
            </h1>
          </div>
          <p className="text-2xl font-black italic tracking-tighter">
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
          </p>
        </div>
        <button 
          onClick={handleCompleteRequest} 
          className="px-6 py-2.5 bg-red-600 hover:bg-red-500 active:scale-95 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all"
        >
          Finalizar
        </button>
      </div>

      {/* EXERCISES LIST */}
      <div className="p-4 space-y-4 max-w-xl mx-auto">
        {workout.exercises.map((ex, i) => {
          const rows = generateTrackingRows(ex);
          const isExpanded = expandedId === ex.exerciseId;
          const completedCount = progress.workoutLogs.filter(l => rows.some(r => r.exerciseId === l.exerciseId && r.globalIndex === l.setIndex)).length;
          const isAllDone = completedCount >= rows.length && rows.length > 0;
          const ghost = ghostMap[ex.exerciseId];
          const dbEx = EXERCISES_DB.find(e => e.id === ex.exerciseId);

          return (
            <div 
              key={i} 
              className={`rounded-[32px] border transition-all ${
                isExpanded 
                  ? 'bg-[#121215] border-white/20 shadow-2xl scale-[1.01]' 
                  : isAllDone 
                  ? 'bg-black/60 opacity-60 border-green-900/40' 
                  : 'bg-[#0F0F11] border-white/5'
              }`}
            >
              {/* HEADER EXERCISE ROW */}
              <div 
                onClick={() => setExpandedId(isExpanded ? null : ex.exerciseId)} 
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
                        👑 {ex.setType.replace('_', ' ')}
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

                  {/* COACH TECHNICAL CUE */}
                  {ex.coachCue && (
                    <div className="bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-2xl text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-start gap-2">
                      <span>💡</span>
                      <div>
                        <span className="font-black text-white/50 text-[8px] block">DIRECTRIZ DEL COACH:</span>
                        {ex.coachCue}
                      </div>
                    </div>
                  )}

                  {/* BIOMECHANICAL CHECKLIST */}
                  {dbEx?.technique && (
                    <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl space-y-1">
                      <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Patrón Biomecánico</p>
                      <p className="text-xs text-white/70 font-medium italic">{dbEx.technique}</p>
                    </div>
                  )}

                  {/* YOUTUBE EMBED PLAYER */}
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

                  {/* BISERIE PAIR VIDEO */}
                  {ex.pair?.videoUrl && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Video Bloque B: {ex.pair.name} 🎥</p>
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
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

                  {/* TRACKING ROWS */}
                  <div className="space-y-2.5 pt-2">
                    {rows.map((row, rIdx) => {
                      const log = progress.workoutLogs.find(l => l.exerciseId === row.exerciseId && l.setIndex === row.globalIndex);
                      return (
                        <div 
                          key={rIdx} 
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                            log ? 'bg-green-600/10 border-green-500/30' : 'bg-black/60 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="w-16 text-center">
                            <p className="text-[7px] font-black text-white/30 uppercase leading-none">{row.label}</p>
                            {row.exerciseName && row.exerciseName !== ex.name && (
                              <p className="text-[6px] font-bold text-white/50 uppercase mt-1 truncate">{row.exerciseName}</p>
                            )}
                          </div>
                          
                          <div className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute -top-3 left-0 text-[6px] text-white/30 uppercase font-black">KG</span>
                              <input 
                                type="number" 
                                placeholder={ghost ? `${ghost.weight}` : row.targetWeight} 
                                className={`w-full bg-transparent text-base font-black outline-none border-b border-white/10 focus:border-red-600 transition-colors ${
                                  ghost ? 'placeholder-white/40' : 'placeholder-white/10'
                                }`} 
                                value={progress.performanceData[row.exerciseId]?.weights[row.globalIndex] || ''} 
                                onChange={e => updateInput(row.exerciseId, row.globalIndex, 'weights', e.target.value)} 
                              />
                            </div>
                            <div className="relative w-16">
                              <span className="absolute -top-3 left-0 text-[6px] text-white/30 uppercase font-black">REPS</span>
                              <input 
                                type="number" 
                                placeholder={ghost ? `${ghost.reps}` : row.targetReps} 
                                className={`w-full bg-transparent text-base font-black outline-none border-b border-white/10 text-center focus:border-red-600 transition-colors ${
                                  ghost ? 'placeholder-white/40' : 'placeholder-white/10'
                                }`} 
                                value={progress.performanceData[row.exerciseId]?.reps[row.globalIndex] || ''} 
                                onChange={e => updateInput(row.exerciseId, row.globalIndex, 'reps', e.target.value)} 
                              />
                            </div>
                          </div>

                          <button 
                            onClick={() => handleLog(ex, row)} 
                            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                              log ? 'bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-95' : 'bg-white/5 hover:bg-white/10 active:scale-90'
                            }`}
                          >
                            {log ? <span className="text-white font-black text-sm">✓</span> : <span className="text-[9px] font-black opacity-40">OK</span>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6 animate-in zoom-in-95">
          <div className="bg-[#121215] w-full max-w-md rounded-[40px] border border-white/10 p-8 shadow-2xl space-y-8 relative overflow-hidden">
            {!aiDebrief && (
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">Reporte de Misión</h2>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-2 italic">Información vital para el Coach</p>
                </div>

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
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Notas Tácticas</label>
                    <textarea 
                      className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-medium text-white/80 outline-none focus:border-red-600 h-24" 
                      placeholder="Ej: Molestia en hombro, muy buen agarre..." 
                      value={feedback.notes} 
                      onChange={e => setFeedback({...feedback, notes: e.target.value})} 
                    />
                  </div>
                </div>

                <button 
                  onClick={generateDebrief}
                  disabled={isAiProcessing}
                  className="w-full py-6 bg-red-600 rounded-[24px] text-white font-black uppercase tracking-[0.4em] text-[10px] shadow-xl hover:bg-red-500 transition-all active:scale-95"
                >
                  {isAiProcessing ? 'GENERANDO INFORME IA...' : 'CONTINUAR AL DEBRIEF ⚡'}
                </button>
              </>
            )}

            {aiDebrief && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_5px_blue]" />
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">Mission Debrief</h2>
                </div>
                
                <div className="bg-black/50 border border-white/5 p-6 rounded-3xl">
                  <p className="text-xs font-medium leading-relaxed text-white/80 whitespace-pre-wrap italic">
                    {aiDebrief}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[8px] font-black text-white/20 uppercase">Volumen</p>
                    <p className="text-lg font-black text-white italic">{progress.workoutLogs.length} sets</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                    <p className="text-[8px] font-black text-white/20 uppercase">RPE Final</p>
                    <p className="text-lg font-black text-red-600 italic">@{feedback.rpe}</p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const updatedLogs = progress.workoutLogs.map(log => ({ 
                      ...log, 
                      athleteId: user?.id,
                      workoutId: workout.id,
                      workoutName: workout.name,
                      feedback 
                    }));
                    onFinish({ ...progress, workoutLogs: updatedLogs, sessionFeedback: feedback });
                  }} 
                  className="w-full py-6 bg-white text-black rounded-[24px] font-black uppercase tracking-[0.4em] text-[10px] shadow-xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
                >
                  CERRAR OPERACIÓN
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
