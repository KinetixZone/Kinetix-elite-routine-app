
import React, { useState, useEffect, useMemo } from 'react';
import { Workout, ProgressState, WorkoutLog, WorkoutExercise, SessionFeedback } from '../../types/kinetix';
import { soundService } from '../../services/soundService';
import { storageService } from '../../services/storageService';
import { aiService } from '../../services/aiService';

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

    if (ex.method === 'biserie' && ex.pair) {
        for (let i = 0; i < (ex.targetSets || 3); i++) {
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
  const [progress, setProgress] = useState<ProgressState>({ currentExerciseIndex: 0, completedSets: 0, isPairTurn: false, subIndex: 0, performanceData: {}, workoutLogs: [], emomCurrentMin: 1, tabataCurrentRound: 1, tabataCurrentSet: 1 });
  const [expandedId, setExpandedId] = useState<string | null>(workout.exercises[0]?.exerciseId);
  const [elapsed, setElapsed] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<SessionFeedback>({ rpe: 7, fatigue: 3, notes: '' });
  const [aiDebrief, setAiDebrief] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const ghostMap = useMemo(() => {
    const map: Record<string, { weight: number, reps: number }> = {};
    workout.exercises.forEach(ex => {
        const last = storageService.getLastPerformance(ex.exerciseId);
        if (last) map[ex.exerciseId] = last;
    });
    return map;
  }, [workout]);

  useEffect(() => { const t = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(t); }, []);

  const handleLog = (exId: string, row: TrackingRow) => {
      const isDone = progress.workoutLogs.some(l => l.exerciseId === row.exerciseId && l.setIndex === row.globalIndex);
      if (isDone) {
          setProgress(p => ({ ...p, workoutLogs: p.workoutLogs.filter(l => !(l.exerciseId === row.exerciseId && l.setIndex === row.globalIndex)) }));
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
          soundService.playTone(800, 0.1);
          setProgress(p => ({ ...p, workoutLogs: [...p.workoutLogs, log] }));
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

  const handleCompleteRequest = async () => {
    setShowFeedback(true);
  };

  const generateDebrief = async () => {
    if (!aiService.isConfigured) {
        setAiDebrief("Misión completada. Datos guardados localmente. (Modo Offline)");
        return;
    }
    setIsAiProcessing(true);
    const summary = progress.workoutLogs.map(l => `${l.exerciseId}: ${l.reps} reps @ ${l.weight}kg`).join(', ');
    const query = `Analiza este entrenamiento táctico: ${summary}. Usuario reportó RPE ${feedback.rpe} y fatiga ${feedback.fatigue}. Da un debrief conciso estilo militar sobre el rendimiento y una sugerencia técnica.`;
    const response = await aiService.getTechnicalAdvice(query);
    setAiDebrief(response);
    setIsAiProcessing(false);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white pb-32">
        <div className="sticky top-0 z-50 bg-[#050507]/90 backdrop-blur-md p-6 border-b border-white/5 flex justify-between items-center px-8">
            <div>
                <h1 className="text-[10px] font-black uppercase text-white/30 tracking-widest">{workout.publicTitle || workout.name}</h1>
                <p className="text-xl font-black italic">{Math.floor(elapsed/60)}:{(elapsed%60).toString().padStart(2,'0')}</p>
            </div>
            <button onClick={handleCompleteRequest} className="px-6 py-2.5 bg-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">Finalizar</button>
        </div>

        <div className="p-4 space-y-4 max-w-xl mx-auto">
            {workout.exercises.map((ex, i) => {
                const rows = generateTrackingRows(ex);
                const isExpanded = expandedId === ex.exerciseId;
                const completedCount = progress.workoutLogs.filter(l => rows.some(r => r.exerciseId === l.exerciseId && r.globalIndex === l.setIndex)).length;
                const isAllDone = completedCount >= rows.length;
                const ghost = ghostMap[ex.exerciseId];

                return (
                    <div key={i} className={`rounded-[32px] border transition-all ${isExpanded ? 'bg-[#121215] border-white/20 shadow-2xl scale-[1.01]' : isAllDone ? 'bg-black opacity-40 border-green-900/30' : 'bg-[#0F0F11] border-white/5'}`}>
                        <div onClick={() => setExpandedId(isExpanded ? null : ex.exerciseId)} className="p-6 flex justify-between items-center cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black ${isAllDone ? 'bg-green-600 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-white/5'}`}>{isAllDone ? '✓' : i + 1}</div>
                                <div><h3 className="text-sm font-black uppercase italic">{ex.name}</h3><p className="text-[9px] text-white/20 uppercase font-black">{completedCount}/{rows.length} Sets</p></div>
                            </div>
                            <span className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                        </div>

                        {isExpanded && (
                            <div className="p-4 border-t border-white/5 space-y-4 bg-black/20">
                                {ex.coachCue && (
                                    <div className="bg-red-500/5 border border-red-500/20 px-4 py-3 rounded-2xl text-[10px] text-red-400 font-bold uppercase tracking-wider">
                                        💡 Indicación: {ex.coachCue}
                                    </div>
                                )}

                                {ex.videoUrl && (
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Video Demostrativo Técnico 🎥</p>
                                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
                                            <iframe 
                                                className="absolute inset-0 w-full h-full" 
                                                src={ex.videoUrl} 
                                                title={ex.name} 
                                                frameBorder="0" 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowFullScreen
                                                referrerPolicy="no-referrer"
                                            />
                                        </div>
                                    </div>
                                )}

                                {ex.pair?.videoUrl && (
                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Video Bravo (B): {ex.pair.name} 🎥</p>
                                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
                                            <iframe 
                                                className="absolute inset-0 w-full h-full" 
                                                src={ex.pair.videoUrl} 
                                                title={ex.pair.name} 
                                                frameBorder="0" 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowFullScreen
                                                referrerPolicy="no-referrer"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 pt-2">
                                    {rows.map((row, rIdx) => {
                                        const log = progress.workoutLogs.find(l => l.exerciseId === row.exerciseId && l.setIndex === row.globalIndex);
                                        return (
                                            <div key={rIdx} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${log ? 'bg-green-600/10 border-green-500/30' : 'bg-black border-white/5 hover:border-white/10'}`}>
                                                <div className="w-16 text-center">
                                                    <p className="text-[7px] font-black text-white/30 uppercase leading-none">{row.label}</p>
                                                    {row.exerciseName && row.exerciseName !== ex.name && (
                                                        <p className="text-[6px] font-bold text-white/50 uppercase mt-1 truncate">{row.exerciseName}</p>
                                                    )}
                                                </div>
                                                <div className="flex-1 flex gap-2">
                                                    <div className="relative flex-1">
                                                        <span className="absolute -top-3 left-0 text-[6px] text-white/20 uppercase font-black">KG</span>
                                                        <input 
                                                            type="number" 
                                                            placeholder={ghost ? `${ghost.weight}` : row.targetWeight} 
                                                            className={`w-full bg-transparent text-lg font-black outline-none border-b border-white/5 focus:border-red-600 transition-colors ${ghost ? 'placeholder-white/40' : 'placeholder-white/10'}`} 
                                                            value={progress.performanceData[row.exerciseId]?.weights[row.globalIndex] || ''} 
                                                            onChange={e => updateInput(row.exerciseId, row.globalIndex, 'weights', e.target.value)} 
                                                        />
                                                    </div>
                                                    <div className="relative w-16">
                                                        <span className="absolute -top-3 left-0 text-[6px] text-white/20 uppercase font-black">REPS</span>
                                                        <input 
                                                            type="number" 
                                                            placeholder={ghost ? `${ghost.reps}` : row.targetReps} 
                                                            className={`w-full bg-transparent text-lg font-black outline-none border-b border-white/5 text-center focus:border-red-600 transition-colors ${ghost ? 'placeholder-white/40' : 'placeholder-white/10'}`} 
                                                            value={progress.performanceData[row.exerciseId]?.reps[row.globalIndex] || ''} 
                                                            onChange={e => updateInput(row.exerciseId, row.globalIndex, 'reps', e.target.value)} 
                                                        />
                                                    </div>
                                                </div>
                                                <button onClick={() => handleLog(row.exerciseId, row)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${log ? 'bg-green-600 shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-95' : 'bg-white/5 hover:bg-white/10 active:scale-90'}`}>
                                                    {log ? <span className="text-white font-black text-sm">✓</span> : <span className="text-[10px] font-black opacity-40">OK</span>}
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

        {showFeedback && (
            <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 animate-in zoom-in-95">
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
                                    <input type="range" min="1" max="10" value={feedback.rpe} onChange={e => setFeedback({...feedback, rpe: parseInt(e.target.value)})} className="w-full accent-red-600" />
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Nivel de Fatiga Post-Op</p>
                                    <div className="flex justify-between gap-2">
                                        {[1,2,3,4,5].map(v => (
                                            <button key={v} onClick={() => setFeedback({...feedback, fatigue: v})} className={`flex-1 h-12 rounded-xl font-black text-xs transition-all ${feedback.fatigue === v ? 'bg-white text-black scale-110 shadow-lg' : 'bg-white/5 text-white/20 hover:bg-white/10'}`}>{v}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Notas Tácticas</label>
                                    <textarea className="w-full bg-black border border-white/10 rounded-2xl p-4 text-xs font-medium text-white/80 outline-none focus:border-red-600 h-24" placeholder="Ej: Molestia en hombro..." value={feedback.notes} onChange={e => setFeedback({...feedback, notes: e.target.value})} />
                                </div>
                            </div>

                            <button 
                                onClick={generateDebrief}
                                disabled={isAiProcessing}
                                className="w-full py-6 bg-red-600 rounded-[24px] text-white font-black uppercase tracking-[0.4em] text-[10px] shadow-xl hover:bg-red-500 transition-all"
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
                                    const updatedLogs = progress.workoutLogs.map(log => ({ ...log, feedback }));
                                    onFinish({ ...progress, workoutLogs: updatedLogs, sessionFeedback: feedback });
                                }} 
                                className="w-full py-6 bg-white text-black rounded-[24px] font-black uppercase tracking-[0.4em] text-[10px] shadow-xl hover:bg-red-600 hover:text-white transition-all"
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
