import React, { useState, useMemo } from 'react';
import { WorkoutExercise, TrainingMethod, DropSetNode, SetType } from '../../types/kinetix';
import { storageService } from '../../services/storageService';
import { getYoutubeEmbedUrl, getYoutubeVideoId } from '../../lib/youtube';

interface Props {
  exercise: WorkoutExercise;
  onUpdate: (updated: WorkoutExercise) => void;
}

export const ExerciseBlockEditor: React.FC<Props> = ({ exercise, onUpdate }) => {
  const [showVideoModal, setShowVideoModal] = useState<string | null>(null);
  const [showSciConfig, setShowSciConfig] = useState(false);
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
      if (exercise.targetRir) {
        finalUpdates.targetRir = normalizeMatrixString(exercise.targetRir, newLen, '2');
      }
      
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

  const updateMatrixValue = (field: 'targetLoad' | 'targetReps' | 'targetRir', setIdx: number, val: string, isPair = false) => {
    const currentStr = (isPair ? exercise.pair?.[field as 'targetLoad' | 'targetReps'] : exercise[field]) || '';
    const parts = currentStr.split(',').map(s => s.trim());
    const targetLen = exercise.targetSets || 1;
    const defaultFallback = field === 'targetLoad' ? '0' : field === 'targetRir' ? '2' : '10';
    while (parts.length < targetLen) parts.push(parts[parts.length - 1] || defaultFallback);
    parts[setIdx] = val;
    const finalStr = parts.join(', ');

    if (isPair && exercise.pair) handleUpdate({ pair: { ...exercise.pair, [field]: finalStr } });
    else handleUpdate({ [field]: finalStr });
  };

  const updateChainValue = (chainIdx: number, field: 'targetLoad' | 'targetReps', setIdx: number, val: string) => {
    const chain = [...(exercise.supersetChain || [])];
    if (!chain[chainIdx]) return;
    const currentStr = chain[chainIdx][field] || '';
    const parts = currentStr.split(',').map(s => s.trim());
    const targetLen = exercise.targetSets || 1;
    const defaultFallback = field === 'targetLoad' ? '0' : '10';
    while (parts.length < targetLen) parts.push(parts[parts.length - 1] || defaultFallback);
    parts[setIdx] = val;
    chain[chainIdx] = { ...chain[chainIdx], [field]: parts.join(', ') };
    handleUpdate({ supersetChain: chain });
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
      { id: 'biserie', label: 'BISERIE', color: 'bg-blue-500', icon: '🔗' },
      { id: 'triserie', label: 'TRISERIE', color: 'bg-indigo-500', icon: '🔺' },
      { id: 'giant_set', label: 'GIGANTE', color: 'bg-rose-500', icon: '⛓️' },
      { id: 'topset_backoff', label: 'TOP+BACK', color: 'bg-amber-500', icon: '👑' },
      { id: 'restpause', label: 'R-PAUSE', color: 'bg-emerald-500', icon: '⏸' },
      { id: 'ahap', label: 'AHAP', color: 'bg-yellow-500', icon: '🔥' },
      { id: 'dropset', label: 'DROP', color: 'bg-purple-600', icon: '📉' },
      { id: 'tabata', label: 'TABA', color: 'bg-pink-500', icon: '⏱' },
      { id: 'emom', label: 'EMOM', color: 'bg-cyan-500', icon: '⚡' },
  ];

  const SET_TYPES: { id: SetType; label: string; desc: string }[] = [
    { id: 'straight', label: 'Serie Normal', desc: 'Carga de trabajo regular' },
    { id: 'top_set', label: 'Top Set', desc: 'Serie principal de máxima carga' },
    { id: 'back_off', label: 'Back-off Set', desc: 'Descarga de volumen (-10-15%)' },
    { id: 'warmup', label: 'Aproximación/PAP', desc: 'Preparación neuromuscular' },
    { id: 'amrap', label: 'Al Fallo (AMRAP)', desc: 'RIR 0 - Máximas repeticiones' },
    { id: 'rest_pause', label: 'Rest-Pause', desc: 'Micro-descansos 15-20s' }
  ];

  const activeVideoUrl = exercise.videoUrl || allExercises.find(x => x.id === exercise.exerciseId)?.videoUrl;

  return (
    <div className="bg-[#0A0A0C] rounded-[40px] border border-white/5 mb-8 overflow-hidden shadow-2xl transition-all group/block">
      {/* SELECTOR DE MÉTODO DE ENTRENAMIENTO */}
      <div className="flex bg-[#121215] p-2 overflow-x-auto border-b border-white/5 no-scrollbar gap-1">
        {METHODS.map(m => (
          <button 
            key={m.id} 
            type="button"
            onClick={() => {
              const updates: Partial<WorkoutExercise> = { method: m.id };
              const defaultOther = allExercises.find(x => x.id !== exercise.exerciseId) || allExercises[0];
              const defaultThird = allExercises.find(x => x.id !== exercise.exerciseId && x.id !== defaultOther?.id) || allExercises[1] || allExercises[0];

              if (m.id === 'biserie' && !exercise.pair) {
                updates.pair = { exerciseId: defaultOther?.id || '', name: defaultOther?.name || '', targetReps: '10', targetLoad: '0', videoUrl: defaultOther?.videoUrl };
              } else if (m.id === 'triserie') {
                if (!exercise.pair) {
                  updates.pair = { exerciseId: defaultOther?.id || '', name: defaultOther?.name || '', targetReps: '10', targetLoad: '0', videoUrl: defaultOther?.videoUrl };
                }
                if (!exercise.supersetChain || exercise.supersetChain.length === 0) {
                  updates.supersetChain = [{ exerciseId: defaultThird?.id || '', name: defaultThird?.name || '', targetReps: '10', targetLoad: '0', videoUrl: defaultThird?.videoUrl }];
                }
              } else if (m.id === 'giant_set') {
                if (!exercise.pair) {
                  updates.pair = { exerciseId: defaultOther?.id || '', name: defaultOther?.name || '', targetReps: '10', targetLoad: '0', videoUrl: defaultOther?.videoUrl };
                }
                if (!exercise.supersetChain || exercise.supersetChain.length < 2) {
                  updates.supersetChain = [
                    { exerciseId: defaultThird?.id || '', name: defaultThird?.name || '', targetReps: '10', targetLoad: '0', videoUrl: defaultThird?.videoUrl },
                    { exerciseId: allExercises[2]?.id || '', name: allExercises[2]?.name || '', targetReps: '10', targetLoad: '0', videoUrl: allExercises[2]?.videoUrl }
                  ];
                }
              } else if (m.id === 'dropset' && !exercise.dropsetConfig) {
                updates.dropsetConfig = { drops: [{ weight: '0', reps: '10' }], strategy: 'fixed' };
              } else if (m.id === 'tabata' && !exercise.tabataConfig) {
                updates.tabataConfig = { rounds: 8, workTimeSec: 20, restTimeSec: 10, sequence: [{ exerciseId: exercise.exerciseId, name: exercise.name, targetReps: '10', targetLoad: '0' }] };
              } else if (m.id === 'emom' && !exercise.emomConfig) {
                updates.emomConfig = { durationMin: 10, sequence: [{ exerciseId: exercise.exerciseId, name: exercise.name, targetReps: '10', targetLoad: '0' }] };
              }
              handleUpdate(updates);
            }} 
            className={`shrink-0 px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all ${exercise.method === m.id ? `${m.color} text-black font-black scale-[1.02]` : 'text-white/30 hover:text-white hover:bg-white/5'}`}
          >
            <span className="text-sm">{m.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-[0.15em]">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* HEADER: CONFIGURACIÓN PRINCIPAL */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-white/[0.02] p-6 rounded-[32px] border border-white/5">
            <div className="flex-1 space-y-3 w-full">
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Ejercicio Alpha (A)</p>
                        {activeVideoUrl && (
                          <button 
                            type="button" 
                            onClick={() => setShowVideoModal(activeVideoUrl)}
                            className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                          >
                            <span>▶</span> Ver Técnica YouTube
                          </button>
                        )}
                    </div>
                    <select className="w-full bg-transparent text-xl font-black uppercase italic text-white outline-none cursor-pointer" value={exercise.exerciseId} onChange={e => {
                        const sel = allExercises.find(x => x.id === e.target.value);
                        if (sel) handleUpdate({ exerciseId: sel.id, name: sel.name, videoUrl: sel.videoUrl, coachCue: exercise.coachCue || sel.technique });
                    }}>
                      {Object.keys(groupedExercises).map(cat => (
                        <optgroup key={cat} label={cat.toUpperCase()} className="bg-[#0F0F11]">
                          {groupedExercises[cat].map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                </div>

                {/* EJERCICIO B (BISERIE, TRISERIE, GIGANTE) */}
                {['biserie', 'triserie', 'giant_set'].includes(exercise.method || '') && (
                    <div className="pt-4 border-t border-white/5 space-y-1 animate-in slide-in-from-left-2">
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Ejercicio Bravo (B)</p>
                            {exercise.pair?.videoUrl && (
                              <button 
                                type="button" 
                                onClick={() => setShowVideoModal(exercise.pair?.videoUrl || '')}
                                className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                              >
                                ▶ Técnica B
                              </button>
                            )}
                        </div>
                        <select className="w-full bg-transparent text-xl font-black uppercase italic text-blue-400 outline-none cursor-pointer" value={exercise.pair?.exerciseId || ''} onChange={e => {
                            const sel = allExercises.find(x => x.id === e.target.value);
                            if (sel) handleUpdate({ pair: { exerciseId: sel.id, name: sel.name, targetReps: '10', targetLoad: '0', videoUrl: sel.videoUrl } });
                        }}>
                          <option value="">-- SELECCIONAR B --</option>
                          {allExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>
                    </div>
                )}

                {/* EJERCICIOS C, D, E... (TRISERIE & SERIE GIGANTE) */}
                {['triserie', 'giant_set'].includes(exercise.method || '') && (
                    <div className="pt-4 border-t border-white/5 space-y-3 animate-in slide-in-from-left-2">
                        {(exercise.supersetChain || []).map((sub, sIdx) => {
                            const letter = ['C', 'D', 'E', 'F', 'G'][sIdx] || `+${sIdx+1}`;
                            const isCharlie = sIdx === 0 && exercise.method === 'triserie';
                            const titleColor = isCharlie ? 'text-indigo-400' : 'text-rose-400';
                            return (
                                <div key={sIdx} className="space-y-1 bg-white/[0.01] p-3 rounded-2xl border border-white/5">
                                    <div className="flex justify-between items-center">
                                        <p className={`text-[10px] font-black ${titleColor} uppercase tracking-[0.3em]`}>
                                            Ejercicio {letter} {isCharlie ? '(Cierre Triserie)' : `(Paso ${sIdx + 3})`}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            {sub.videoUrl && (
                                                <button 
                                                  type="button" 
                                                  onClick={() => setShowVideoModal(sub.videoUrl || '')}
                                                  className="bg-white/5 hover:bg-white/20 text-white/70 hover:text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all"
                                                >
                                                  ▶ Técnica {letter}
                                                </button>
                                            )}
                                            {exercise.method === 'giant_set' && (exercise.supersetChain?.length || 0) > 1 && (
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const nextChain = (exercise.supersetChain || []).filter((_, i) => i !== sIdx);
                                                        handleUpdate({ supersetChain: nextChain });
                                                    }}
                                                    className="text-red-400 hover:text-red-300 text-[9px] font-black uppercase"
                                                >
                                                    ✕ Quitar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <select 
                                        className={`w-full bg-transparent text-xl font-black uppercase italic ${titleColor} outline-none cursor-pointer`}
                                        value={sub.exerciseId}
                                        onChange={e => {
                                            const sel = allExercises.find(x => x.id === e.target.value);
                                            if (sel) {
                                                const nextChain = [...(exercise.supersetChain || [])];
                                                nextChain[sIdx] = { ...nextChain[sIdx], exerciseId: sel.id, name: sel.name, videoUrl: sel.videoUrl };
                                                handleUpdate({ supersetChain: nextChain });
                                            }
                                        }}
                                    >
                                        <option value="">-- SELECCIONAR {letter} --</option>
                                        {allExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                                    </select>
                                </div>
                            );
                        })}

                        {exercise.method === 'giant_set' && (
                            <button 
                                type="button"
                                onClick={() => {
                                    const nextChain = [...(exercise.supersetChain || [])];
                                    const nextEx = allExercises[nextChain.length % allExercises.length];
                                    nextChain.push({ exerciseId: nextEx.id, name: nextEx.name, targetReps: '10', targetLoad: '0', videoUrl: nextEx.videoUrl });
                                    handleUpdate({ supersetChain: nextChain });
                                }}
                                className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                                + Añadir Ejercicio a Serie Gigante
                            </button>
                        )}
                    </div>
                )}
            </div>
            
            <div className="flex flex-wrap gap-3 shrink-0">
                <div className="bg-black/60 px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                    <span className="text-[9px] font-black text-white/40 uppercase">Sets:</span>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => handleUpdate({ targetSets: Math.max(1, (exercise.targetSets || 1) - 1) })} className="text-white/40 hover:text-white font-black text-lg">-</button>
                        <input type="number" className="bg-transparent text-white font-black w-8 outline-none text-center text-lg" value={exercise.targetSets || 1} onChange={e => handleUpdate({ targetSets: parseInt(e.target.value) || 1 })} />
                        <button type="button" onClick={() => handleUpdate({ targetSets: (exercise.targetSets || 1) + 1 })} className="text-white/40 hover:text-white font-black text-lg">+</button>
                    </div>
                </div>
                <div className="bg-black/60 px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Rest:</span>
                    <div className="flex items-center gap-1">
                      <input type="number" className="bg-transparent text-red-500 font-black w-12 outline-none text-center text-lg" value={exercise.targetRest ?? 90} onChange={e => handleUpdate({ targetRest: parseInt(e.target.value) || 0 })} />
                      <span className="text-[8px] font-black text-white/30">SEG</span>
                    </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowSciConfig(!showSciConfig)} 
                  className={`px-4 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${showSciConfig ? 'bg-red-600 text-white border-red-500 shadow-lg' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                >
                  <span>🔬</span> Ciencias del Deporte
                </button>
            </div>
        </div>

        {/* PANEL EXPANDIBLE: PARÁMETROS CIENTÍFICOS DE RENDIMIENTO */}
        {showSciConfig && (
          <div className="bg-[#121215] border border-red-600/30 rounded-3xl p-6 space-y-6 animate-in slide-in-from-top-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-sm">🧪</span>
                <h4 className="text-xs font-black uppercase tracking-widest text-red-400">Prescripción Biomecánica & Esfuerzo</h4>
              </div>
              <span className="text-[8px] font-mono text-white/30 uppercase">Sports Science Protocols</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* TIPO DE SERIE */}
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-white/40 tracking-widest block">Tipo Fisiológico</label>
                <select 
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-red-500"
                  value={exercise.setType || 'straight'}
                  onChange={e => handleUpdate({ setType: e.target.value as SetType })}
                >
                  {SET_TYPES.map(st => <option key={st.id} value={st.id}>{st.label}</option>)}
                </select>
                <p className="text-[7px] text-white/30 truncate">{SET_TYPES.find(st => st.id === (exercise.setType || 'straight'))?.desc}</p>
              </div>

              {/* RIR / RPE OBJETIVO */}
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-white/40 tracking-widest block">RIR / RPE Objetivo</label>
                <input 
                  type="text" 
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs font-bold text-yellow-400 outline-none focus:border-yellow-500"
                  placeholder="ej: RIR 2 / @8"
                  value={exercise.targetRir || ''}
                  onChange={e => handleUpdate({ targetRir: e.target.value })}
                />
                <p className="text-[7px] text-white/30">Reps en Reserva para autoregulación</p>
              </div>

              {/* TEMPO (CADENCIA) */}
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-white/40 tracking-widest block">Tempo (Cadencia)</label>
                <input 
                  type="text" 
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs font-bold text-cyan-400 outline-none focus:border-cyan-500"
                  placeholder="ej: 3-0-1-0"
                  value={exercise.tempo || ''}
                  onChange={e => handleUpdate({ tempo: e.target.value })}
                />
                <p className="text-[7px] text-white/30">Excéntrico-Pausa-Concéntrico-Pausa</p>
              </div>

              {/* % 1RM INTENSIDAD */}
              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-white/40 tracking-widest block">% 1RM Intensidad</label>
                <input 
                  type="text" 
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs font-bold text-pink-400 outline-none focus:border-pink-500"
                  placeholder="ej: 75% - 80%"
                  value={exercise.intensityPercent || ''}
                  onChange={e => handleUpdate({ intensityPercent: e.target.value })}
                />
                <p className="text-[7px] text-white/30">Carga relativa a fuerza máxima</p>
              </div>
            </div>

            {/* CUES / INDICACIONES TÉCNICAS */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase text-white/40 tracking-widest block">
                Indicaciones Técnicas & Biomecánicas (Cues de Ejecución)
              </label>
              <input 
                type="text" 
                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white/90 outline-none focus:border-red-500"
                placeholder="ej: Retracción escapular, empujar desde el talón, codos a 45 grados..."
                value={exercise.coachCue || ''}
                onChange={e => handleUpdate({ coachCue: e.target.value })}
              />
            </div>

            {/* ENLACE DIRECTO DE VIDEO YOUTUBE PERSONALIZADO */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-black uppercase text-white/40 tracking-widest block">
                Link de Demostración YouTube (Personalizado)
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white/90 outline-none focus:border-red-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={exercise.videoUrl || ''}
                  onChange={e => handleUpdate({ videoUrl: e.target.value })}
                />
                {exercise.videoUrl && (
                  <button 
                    type="button"
                    onClick={() => setShowVideoModal(exercise.videoUrl || '')}
                    className="bg-red-600 hover:bg-red-500 text-white px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                  >
                    Probar ▶
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MATRIZ DE RENDIMIENTO (STD / AHAP / BISERIE / TRISERIE / GIGANTE / DROPSET / TOPSET / RESTPAUSE) */}
        {(['standard', 'ahap', 'biserie', 'triserie', 'giant_set', 'dropset', 'topset_backoff', 'restpause', 'clusters'].includes(exercise.method || '')) && (
            <div className="bg-black/40 p-6 rounded-[32px] border border-white/5">
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    {Array.from({ length: exercise.targetSets || 1 }).map((_, i) => (
                        <div key={i} className={`shrink-0 ${exercise.method === 'dropset' ? 'w-64' : 'w-48'} space-y-3`}>
                            <div className="flex justify-between items-center px-1">
                              <p className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">SET {i+1}</p>
                              {exercise.method === 'topset_backoff' && (
                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded ${i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/40'}`}>
                                  {i === 0 ? 'TOP SET' : 'BACK-OFF'}
                                </span>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                                {/* CARD PRINCIPAL (A) */}
                                <div className="bg-[#121215] p-3 rounded-2xl border border-white/5 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[7px] font-black text-yellow-500 uppercase">A-KG</span>
                                        <input type="text" className="w-20 bg-transparent text-right text-lg font-black text-yellow-500 outline-none" value={(exercise.targetLoad || '').split(',')[i]?.trim() || '0'} onChange={e => updateMatrixValue('targetLoad', i, e.target.value)} />
                                    </div>
                                    <div className="flex items-center justify-between border-t border-white/5 pt-2">
                                        <span className="text-[7px] font-black text-white/20 uppercase">A-REPS</span>
                                        <input type="text" className="w-16 bg-transparent text-right text-xs font-black text-white outline-none" value={(exercise.targetReps || '').split(',')[i]?.trim() || '10'} onChange={e => updateMatrixValue('targetReps', i, e.target.value)} />
                                    </div>
                                    {exercise.targetRir !== undefined && (
                                      <div className="flex items-center justify-between border-t border-white/5 pt-2">
                                          <span className="text-[7px] font-black text-cyan-400/60 uppercase">RIR</span>
                                          <input type="text" className="w-12 bg-transparent text-right text-xs font-black text-cyan-400 outline-none" value={(exercise.targetRir || '').split(',')[i]?.trim() || '2'} onChange={e => updateMatrixValue('targetRir', i, e.target.value)} placeholder="2" />
                                      </div>
                                    )}
                                </div>

                                {/* CARD BISERIE / TRISERIE / GIGANTE (B) */}
                                {['biserie', 'triserie', 'giant_set'].includes(exercise.method || '') && exercise.pair && (
                                    <div className="bg-[#0A0A0C] p-3 rounded-2xl border border-blue-500/20 space-y-2.5 animate-in fade-in slide-in-from-top-2">
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

                                {/* CARDS TRISERIE & GIGANTE (C, D, E...) */}
                                {['triserie', 'giant_set'].includes(exercise.method || '') && (exercise.supersetChain || []).map((sub, sIdx) => {
                                    const letter = ['C', 'D', 'E', 'F', 'G'][sIdx] || `+${sIdx+1}`;
                                    const borderClass = sIdx === 0 ? 'border-indigo-500/20' : 'border-rose-500/20';
                                    const textClass = sIdx === 0 ? 'text-indigo-400' : 'text-rose-400';
                                    return (
                                        <div key={sIdx} className={`bg-[#0A0A0C] p-3 rounded-2xl border ${borderClass} space-y-2.5 animate-in fade-in slide-in-from-top-2`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[7px] font-black ${textClass} uppercase`}>{letter}-KG</span>
                                                <input type="text" className={`w-20 bg-transparent text-right text-lg font-black ${textClass} outline-none`} value={(sub.targetLoad || '').split(',')[i]?.trim() || '0'} onChange={e => updateChainValue(sIdx, 'targetLoad', i, e.target.value)} />
                                            </div>
                                            <div className="flex items-center justify-between border-t border-white/5 pt-2">
                                                <span className="text-[7px] font-black text-white/20 uppercase">{letter}-REPS</span>
                                                <input type="text" className="w-12 bg-transparent text-right text-xs font-black text-white outline-none" value={(sub.targetReps || '').split(',')[i]?.trim() || '10'} onChange={e => updateChainValue(sIdx, 'targetReps', i, e.target.value)} />
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* CARDS DROPS */}
                                {exercise.method === 'dropset' && exercise.dropsetConfig?.drops.map((drop, dIdx) => (
                                    <div key={dIdx} className="bg-purple-900/10 p-3 rounded-2xl border border-purple-500/20 space-y-3 relative overflow-hidden animate-in slide-in-from-left-2">
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newDrops = [...(exercise.dropsetConfig?.drops || [])].filter((_, idx) => idx !== dIdx);
                                                handleUpdate({ dropsetConfig: { ...exercise.dropsetConfig, drops: newDrops } });
                                            }}
                                            className="absolute top-1 right-2 text-[9px] text-purple-400/40 hover:text-red-500 transition-colors font-black z-10"
                                            title="Eliminar Drop"
                                        >
                                            ✕
                                        </button>
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
                                    <button type="button" onClick={addDropNode} className="w-full py-3 border border-dashed border-purple-500/30 rounded-xl text-[7px] font-black text-purple-500/50 hover:text-purple-500 uppercase tracking-widest transition-all">
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
                    <div className="flex flex-wrap items-center gap-8">
                        <div>
                            <label className="text-[10px] font-black text-white/30 uppercase block mb-4 tracking-[0.4em]">{exercise.method === 'emom' ? 'Minutos Totales' : 'Rondas Totales'}</label>
                            <input type="number" className="bg-transparent text-7xl font-black text-white outline-none w-32 italic" value={exercise.method === 'emom' ? (exercise.emomConfig?.durationMin || 1) : (exercise.tabataConfig?.rounds || 1)} onChange={e => {
                                const val = parseInt(e.target.value) || 1;
                                if(exercise.method === 'emom') handleUpdate({ targetSets: val, emomConfig: { ...(exercise.emomConfig || { sequence: [] }), durationMin: val } });
                                else handleUpdate({ targetSets: val, tabataConfig: { ...(exercise.tabataConfig || { rounds: val, workTimeSec: 20, restTimeSec: 10, sequence: [] }), rounds: val } });
                            }}/>
                        </div>

                        {exercise.method === 'tabata' && (
                            <div className="flex gap-6 bg-black/40 px-6 py-4 rounded-3xl border border-white/5">
                                <div className="space-y-1 text-center">
                                    <label className="text-[8px] font-black uppercase text-white/30 tracking-widest block">Trabajo (seg)</label>
                                    <input 
                                        type="number" 
                                        className="bg-transparent text-3xl font-black text-pink-500 outline-none w-16 text-center" 
                                        value={exercise.tabataConfig?.workTimeSec ?? 20} 
                                        onChange={e => {
                                            const val = parseInt(e.target.value) || 0;
                                            handleUpdate({ 
                                                tabataConfig: { 
                                                    ...(exercise.tabataConfig || { rounds: 8, restTimeSec: 10, sequence: [] }), 
                                                    workTimeSec: val 
                                                } 
                                            });
                                        }}
                                    />
                                </div>
                                <div className="w-[1px] bg-white/5 self-stretch" />
                                <div className="space-y-1 text-center">
                                    <label className="text-[8px] font-black uppercase text-white/30 tracking-widest block">Descanso (seg)</label>
                                    <input 
                                        type="number" 
                                        className="bg-transparent text-3xl font-black text-white/60 outline-none w-16 text-center" 
                                        value={exercise.tabataConfig?.restTimeSec ?? 10} 
                                        onChange={e => {
                                            const val = parseInt(e.target.value) || 0;
                                            handleUpdate({ 
                                                tabataConfig: { 
                                                    ...(exercise.tabataConfig || { rounds: 8, workTimeSec: 20, sequence: [] }), 
                                                    restTimeSec: val 
                                                } 
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-2">Protocolo de Secuencia</p>
                        <p className="text-xs text-white/40 max-w-[200px]">Define la lista de ejercicios. El sistema los ciclará automáticamente hasta completar el tiempo.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Arquitectura de Intervalo</p>
                        <button type="button" onClick={() => {
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
                                  <input type="text" className="w-20 bg-black border border-white/10 rounded-xl p-3 text-center text-xs font-black text-cyan-400" value={item.targetLoad || ''} onChange={e => {
                                      const key = exercise.method === 'emom' ? 'emomConfig' : 'tabataConfig';
                                      const config = (exercise as any)[key];
                                      const seq = [...(config.sequence || [])];
                                      seq[idx] = { ...seq[idx], targetLoad: e.target.value };
                                      handleUpdate({ [key]: { ...config, sequence: seq } });
                                  }} placeholder="KG"/>
                                  <input type="text" className="w-16 bg-black border border-white/10 rounded-xl p-3 text-center text-xs font-black text-white" value={item.targetReps || ''} onChange={e => {
                                      const key = exercise.method === 'emom' ? 'emomConfig' : 'tabataConfig';
                                      const config = (exercise as any)[key];
                                      const seq = [...(config.sequence || [])];
                                      seq[idx] = { ...seq[idx], targetReps: e.target.value };
                                      handleUpdate({ [key]: { ...config, sequence: seq } });
                                  }} placeholder="REPS"/>
                                </div>
                                <button type="button" onClick={() => {
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

      {/* MODAL REPRODUCTOR DE VIDEO YOUTUBE */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-[#0F0F11] border border-white/10 rounded-[32px] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-red-500 text-lg">▶</span>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Demostración Técnica: {exercise.name}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowVideoModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 text-white flex items-center justify-center font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
              {getYoutubeEmbedUrl(showVideoModal) ? (
                <iframe 
                  className="absolute inset-0 w-full h-full"
                  src={getYoutubeEmbedUrl(showVideoModal, true)}
                  title={exercise.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-xs text-white/50 uppercase font-black">URL de video no compatible con reproducción directa</p>
                  <a href={showVideoModal} target="_blank" rel="noreferrer" className="mt-4 px-4 py-2 bg-red-600 rounded-xl text-xs font-black uppercase text-white">
                    Abrir en YouTube
                  </a>
                </div>
              )}
            </div>

            {exercise.coachCue && (
              <div className="bg-red-950/20 border border-red-500/20 p-4 rounded-xl text-xs text-red-300">
                <span className="font-black uppercase block text-[9px] text-red-500 mb-1">💡 Indicación Biomecánica:</span>
                {exercise.coachCue}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};