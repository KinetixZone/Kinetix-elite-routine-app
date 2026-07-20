import React, { useState, useMemo } from 'react';
import { WorkoutExercise, TrainingMethod, IntervalItem, DropSetNode } from '../../types/kinetix';
import { storageService } from '../../services/storageService';

interface Props {
  exercise: WorkoutExercise;
  onUpdate: (updated: WorkoutExercise) => void;
}

export const ExerciseBlockEditor: React.FC<Props> = ({ exercise, onUpdate }) => {
  const allExercises = useMemo(() => storageService.getExercises(), []);
  
  const groupedExercises = useMemo(() => {
    const groups: Record<string, typeof allExercises> = {};
    allExercises.forEach(ex => {
      const category = ex.muscleGroup.split(' / ')[0];
      if (!groups[category]) groups[category] = [];
      groups[category].push(ex);
    });
    return groups;
  }, [allExercises]);

  const normalizeMatrixString = (str: string | undefined, length: number, fallback: string): string => {
    const parts = (str || '').split(',').map(s => s.trim()).filter(s => s !== '');
    const normalized = [];
    for (let i = 0; i < length; i++) {
      normalized.push(parts[i] || parts[parts.length - 1] || fallback);
    }
    return normalized.join(', ');
  };

  const handleUpdate = (updates: Partial<WorkoutExercise>) => {
    let finalUpdates = { ...updates };
    
    // Sincronización masiva al cambiar sets
    if (updates.targetSets !== undefined && updates.targetSets !== exercise.targetSets) {
      const newLen = updates.targetSets;
      finalUpdates.targetLoad = normalizeMatrixString(exercise.targetLoad, newLen, '0');
      finalUpdates.targetReps = normalizeMatrixString(exercise.targetReps, newLen, '10');
      
      if (exercise.pair) {
        finalUpdates.pair = {
          ...exercise.pair,
          targetLoad: normalizeMatrixString(exercise.pair.targetLoad, newLen, '0'),
          targetReps: normalizeMatrixString(exercise.pair.targetReps, newLen, '10')
        };
      }

      if (exercise.dropsetConfig) {
        finalUpdates.dropsetConfig = {
          ...exercise.dropsetConfig,
          drops: exercise.dropsetConfig.drops.map(d => ({
            weight: normalizeMatrixString(d.weight, newLen, '0'),
            reps: normalizeMatrixString(d.reps, newLen, '10')
          }))
        };
      }
    }
    
    onUpdate({ ...exercise, ...finalUpdates });
  };

  const updateMatrixValue = (field: 'targetLoad' | 'targetReps', setIdx: number, val: string, isPair = false) => {
    const currentStr = (isPair ? exercise.pair?.[field] : exercise[field]) || '';
    const parts = currentStr.split(',').map(s => s.trim());
    const targetLen = exercise.targetSets || 1;
    while (parts.length < targetLen) parts.push(parts[parts.length - 1] || (field === 'targetLoad' ? '0' : '10'));
    parts[setIdx] = val;
    const finalStr = parts.join(', ');

    if (isPair && exercise.pair) handleUpdate({ pair: { ...exercise.pair, [field]: finalStr } });
    else handleUpdate({ [field]: finalStr });
  };

  const updateDropMatrix = (dropIdx: number, field: 'weight' | 'reps', setIdx: number, val: string) => {
    if (!exercise.dropsetConfig) return;
    const newDrops = [...exercise.dropsetConfig.drops];
    const currentStr = newDrops[dropIdx][field] || '';
    const parts = currentStr.split(',').map(s => s.trim());
    const targetLen = exercise.targetSets || 1;
    while (parts.length < targetLen) parts.push(parts[parts.length - 1] || (field === 'weight' ? '0' : '10'));
    parts[setIdx] = val;
    newDrops[dropIdx] = { ...newDrops[dropIdx], [field]: parts.join(', ') };
    handleUpdate({ dropsetConfig: { ...exercise.dropsetConfig, drops: newDrops } });
  };

  const addDropNode = () => {
    const currentDrops = exercise.dropsetConfig?.drops || [];
    const newDrop: DropSetNode = { weight: '0', reps: '10' };
    handleUpdate({ 
        method: 'dropset',
        dropsetConfig: { drops: [...currentDrops, newDrop], strategy: 'fixed' } 
    });
  };

  const METHODS: { id: TrainingMethod; label: string; color: string; icon: string }[] = [
      { id: 'standard', label: 'STD', color: 'bg-white', icon: '⚡' },
      { id: 'ahap', label: 'AHAP', color: 'bg-yellow-500', icon: '🔥' },
      { id: 'dropset', label: 'DROP', color: 'bg-purple-600', icon: '📉' },
      { id: 'biserie', label: 'BISE', color: 'bg-blue-500', icon: '🔗' },
      { id: 'tabata', label: 'TABA', color: 'bg-pink-500', icon: '⏱' },
      { id: 'emom', label: 'EMOM', color: 'bg-cyan-500', icon: '⚡' },
  ];

  return (
    <div className="bg-[#0A0A0C] rounded-[40px] border border-white/5 mb-8 overflow-hidden shadow-2xl transition-all group/block">
      {/* SELECTOR DE MÉTODO */}
      <div className="flex bg-[#121215] p-2 overflow-x-auto border-b border-white/5 no-scrollbar gap-1">
        {METHODS.map(m => (
          <button key={m.id} onClick={() => handleUpdate({ method: m.id })} className={`shrink-0 px-4 py-3 rounded-2xl flex items-center gap-2 transition-all ${exercise.method === m.id ? `${m.color} text-black font-black scale-[1.02]` : 'text-white/20 hover:text-white hover:bg-white/5'}`}>
            <span className="text-sm">{m.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="p-8 space-y-8">
        {/* HEADER: CONFIGURACIÓN PRINCIPAL */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-white/[0.02] p-6 rounded-[32px] border border-white/5">
            <div className="flex-1 space-y-4 w-full">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Ejercicio Alpha (A)</p>
                    <select className="w-full bg-transparent text-xl font-black uppercase italic text-white outline-none" value={exercise.exerciseId} onChange={e => {
                        const sel = allExercises.find(x => x.id === e.target.value);
                        if (sel) handleUpdate({ exerciseId: sel.id, name: sel.name, videoUrl: sel.videoUrl });
                    }}>
                      {Object.keys(groupedExercises).map(cat => (
                        <optgroup key={cat} label={cat.toUpperCase()} className="bg-[#0F0F11]">
                          {groupedExercises[cat].map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                </div>

                {exercise.method === 'biserie' && (
                    <div className="pt-4 border-t border-white/5 space-y-1 animate-in slide-in-from-left-2">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Ejercicio Bravo (B)</p>
                        <select className="w-full bg-transparent text-xl font-black uppercase italic text-blue-400 outline-none" value={exercise.pair?.exerciseId || ''} onChange={e => {
                            const sel = allExercises.find(x => x.id === e.target.value);
                            if (sel) handleUpdate({ pair: { exerciseId: sel.id, name: sel.name, targetReps: '10', targetLoad: '0', videoUrl: sel.videoUrl } });
                        }}>
                          <option value="">-- SELECCIONAR B --</option>
                          {allExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>
                    </div>
                )}
            </div>
            
            <div className="flex gap-4 shrink-0">
                <div className="bg-black/60 px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-4">
                    <span className="text-[9px] font-black text-white/40 uppercase">Sets:</span>
                    <div className="flex items-center gap-4">
                        <button onClick={() => handleUpdate({ targetSets: Math.max(1, (exercise.targetSets || 1) - 1) })} className="text-white/40 hover:text-white font-black text-xl">-</button>
                        <input type="number" className="bg-transparent text-white font-black w-8 outline-none text-center text-xl" value={exercise.targetSets || 1} onChange={e => handleUpdate({ targetSets: parseInt(e.target.value) || 1 })} />
                        <button onClick={() => handleUpdate({ targetSets: (exercise.targetSets || 1) + 1 })} className="text-white/40 hover:text-white font-black text-xl">+</button>
                    </div>
                </div>
                <div className="bg-black/60 px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-4">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Rest:</span>
                    <input type="number" className="bg-transparent text-red-600 font-black w-10 outline-none text-center text-xl" value={exercise.targetRest || 0} onChange={e => handleUpdate({ targetRest: parseInt(e.target.value) || 0 })} />
                </div>
            </div>
        </div>

        {/* MATRIZ DE RENDIMIENTO (STD / AHAP / BISERIE / DROPSET) */}
        {(['standard', 'ahap', 'biserie', 'dropset'].includes(exercise.method || '')) && (
            <div className="bg-black/40 p-6 rounded-[32px] border border-white/5">
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {Array.from({ length: exercise.targetSets || 1 }).map((_, i) => (
                        <div key={i} className={`shrink-0 ${exercise.method === 'dropset' ? 'w-64' : 'w-40'} space-y-4`}>
                            <p className="text-[10px] font-black text-white/10 uppercase text-center tracking-widest italic">SET {i+1}</p>
                            
                            <div className="space-y-2">
                                {/* CARD PRINCIPAL (A) */}
                                <div className="bg-[#121215] p-3 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[7px] font-black text-white/20 uppercase">KG</span>
                                        <input type="text" className="w-20 bg-transparent text-right text-lg font-black text-yellow-500 outline-none" value={(exercise.targetLoad || '').split(',')[i]?.trim() || '0'} onChange={e => updateMatrixValue('targetLoad', i, e.target.value)} />
                                    </div>
                                    <div className="flex items-center justify-between border-t border-white/5 pt-2">
                                        <span className="text-[7px] font-black text-white/20 uppercase">REPS</span>
                                        <input type="text" className="w-12 bg-transparent text-right text-xs font-black text-white outline-none" value={(exercise.targetReps || '').split(',')[i]?.trim() || '10'} onChange={e => updateMatrixValue('targetReps', i, e.target.value)} />
                                    </div>
                                </div>

                                {/* CARD BISERIE (B) */}
                                {exercise.method === 'biserie' && exercise.pair && (
                                    <div className="bg-[#0A0A0C] p-3 rounded-2xl border border-blue-500/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[7px] font-black text-blue-500 uppercase">B-KG</span>
                                            <input type="text" className="w-20 bg-transparent text-right text-lg font-black text-blue-400 outline-none" value={(exercise.pair.targetLoad || '').split(',')[i]?.trim() || '0'} onChange={e => updateMatrixValue('targetLoad', i, e.target.value, true)} />
                                        </div>
                                        <div className="flex items-center justify-between border-t border-white/5 pt-2">
                                            <span className="text-[7px] font-black text-white/20 uppercase">B-REPS</span>
                                            <input type="text" className="w-12 bg-transparent text-right text-xs font-black text-white outline-none" value={(exercise.pair.targetReps || '').split(',')[i]?.trim() || '10'} onChange={e => updateMatrixValue('targetReps', i, e.target.value, true)} />
                                        </div>
                                    </div>
                                )}

                                {/* CARDS DROPS */}
                                {exercise.method === 'dropset' && exercise.dropsetConfig?.drops.map((drop, dIdx) => (
                                    <div key={dIdx} className="bg-purple-900/10 p-3 rounded-2xl border border-purple-500/20 space-y-3 relative overflow-hidden animate-in slide-in-from-left-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[7px] font-black text-purple-400 uppercase">DROP {dIdx+1}</span>
                                            <input type="text" className="w-20 bg-transparent text-right text-lg font-black text-purple-300 outline-none" value={(drop.weight || '').split(',')[i]?.trim() || '0'} onChange={e => updateDropMatrix(dIdx, 'weight', i, e.target.value)} />
                                        </div>
                                        <div className="flex items-center justify-between border-t border-white/5 pt-2">
                                            <span className="text-[7px] font-black text-white/10 uppercase">REPS</span>
                                            <input type="text" className="w-12 bg-transparent text-right text-xs font-black text-white/50 outline-none" value={(drop.reps || '').split(',')[i]?.trim() || '10'} onChange={e => updateDropMatrix(dIdx, 'reps', i, e.target.value)} />
                                        </div>
                                    </div>
                                ))}
                                
                                {exercise.method === 'dropset' && i === 0 && (
                                    <button onClick={addDropNode} className="w-full py-3 border border-dashed border-purple-500/30 rounded-xl text-[7px] font-black text-purple-500/50 hover:text-purple-500 uppercase tracking-widest transition-all">
                                        + AÑADIR DROP
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* MODOS INTERVALOS (EMOM / TABATA) */}
        {(exercise.method === 'emom' || exercise.method === 'tabata') && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-cyan-950/20 p-8 rounded-[40px] border border-cyan-500/20 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <label className="text-[10px] font-black text-white/30 uppercase block mb-4 tracking-[0.4em]">{exercise.method === 'emom' ? 'Minutos Totales' : 'Rondas Totales'}</label>
                        <input type="number" className="bg-transparent text-7xl font-black text-white outline-none w-32 italic" value={exercise.method === 'emom' ? (exercise.emomConfig?.durationMin || 1) : (exercise.tabataConfig?.rounds || 1)} onChange={e => {
                            const val = parseInt(e.target.value) || 1;
                            if(exercise.method === 'emom') handleUpdate({ targetSets: val, emomConfig: { ...(exercise.emomConfig || { sequence: [] }), durationMin: val } });
                            else handleUpdate({ targetSets: val, tabataConfig: { ...(exercise.tabataConfig || { rounds: val, workTimeSec: 20, restTimeSec: 10, sequence: [] }), rounds: val } });
                        }}/>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-2">Protocolo de Secuencia</p>
                        <p className="text-xs text-white/40 max-w-[200px]">Define la lista de ejercicios. El sistema los ciclará automáticamente hasta completar el tiempo.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Arquitectura de Intervalo</p>
                        <button onClick={() => {
                            const key = exercise.method === 'emom' ? 'emomConfig' : 'tabataConfig';
                            const config = (exercise as any)[key] || { sequence: [] };
                            const newItem = { exerciseId: allExercises[0].id, name: allExercises[0].name, targetReps: '10', targetLoad: '0' };
                            handleUpdate({ [key]: { ...config, sequence: [...(config.sequence || []), newItem] } });
                        }} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-black transition-all">+ AÑADIR ITEM</button>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {(exercise.method === 'emom' ? exercise.emomConfig?.sequence : exercise.tabataConfig?.sequence)?.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-center bg-[#151518] p-4 rounded-[24px] border border-white/5 group/item hover:border-cyan-500/20 transition-all">
                                <span className="text-[10px] font-black text-cyan-500 w-8 italic text-center">#{idx + 1}</span>
                                <select className="flex-1 bg-transparent text-sm font-black uppercase text-white outline-none" value={item.exerciseId} onChange={e => {
                                    const sel = allExercises.find(x => x.id === e.target.value);
                                    if(sel) {
                                      const key = exercise.method === 'emom' ? 'emomConfig' : 'tabataConfig';
                                      const config = (exercise as any)[key];
                                      const seq = [...(config.sequence || [])];
                                      seq[idx] = { ...seq[idx], exerciseId: sel.id, name: sel.name };
                                      handleUpdate({ [key]: { ...config, sequence: seq } });
                                    }
                                }}>
                                    {allExercises.map(ex => <option key={ex.id} value={ex.id} className="bg-black text-white">{ex.name}</option>)}
                                </select>
                                <div className="flex gap-2">
                                  <input type="text" className="w-20 bg-black border border-white/10 rounded-xl p-3 text-center text-xs font-black text-cyan-400" value={item.targetLoad} onChange={e => {
                                      const key = exercise.method === 'emom' ? 'emomConfig' : 'tabataConfig';
                                      const config = (exercise as any)[key];
                                      const seq = [...(config.sequence || [])];
                                      seq[idx] = { ...seq[idx], targetLoad: e.target.value };
                                      handleUpdate({ [key]: { ...config, sequence: seq } });
                                  }} placeholder="KG"/>
                                  <input type="text" className="w-16 bg-black border border-white/10 rounded-xl p-3 text-center text-xs font-black text-white" value={item.targetReps} onChange={e => {
                                      const key = exercise.method === 'emom' ? 'emomConfig' : 'tabataConfig';
                                      const config = (exercise as any)[key];
                                      const seq = [...(config.sequence || [])];
                                      seq[idx] = { ...seq[idx], targetReps: e.target.value };
                                      handleUpdate({ [key]: { ...config, sequence: seq } });
                                  }} placeholder="REPS"/>
                                </div>
                                <button onClick={() => {
                                    const key = exercise.method === 'emom' ? 'emomConfig' : 'tabataConfig';
                                    const config = (exercise as any)[key];
                                    const seq = [...(config.sequence || [])].filter((_, i) => i !== idx);
                                    handleUpdate({ [key]: { ...config, sequence: seq } });
                                }} className="text-red-500/20 hover:text-red-500 px-3 transition-colors">✕</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};