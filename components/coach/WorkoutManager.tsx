
import React, { useState, useEffect } from 'react';
import { Workout, WorkoutExercise, Exercise, User } from '../../types/kinetix';
import { storageService } from '../../services/storageService';
import { calendarService } from '../../services/calendarService';
import { ExerciseBlockEditor } from './ExerciseBlockEditor';
import { aiService } from '../../services/aiService';

export const WorkoutManager: React.FC = () => {
  const [view, setView] = useState<'list' | 'editor' | 'assign' | 'meso'>('list');
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Workout | null>(null);
  const [assignTarget, setAssignTarget] = useState<Workout | null>(null);
  const [athletes, setAthletes] = useState<User[]>([]);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [projConfig, setProjConfig] = useState({ 
    startDate: new Date().toISOString().split('T')[0], 
    weeks: 4, 
    days: [] as number[], 
    incWeight: 2.5, 
    incReps: 0 
  });

  useEffect(() => { refreshData(); }, []);

  const refreshData = async () => {
    const all = await storageService.getTemplates();
    setTemplates(all.filter(t => t.isTemplate !== false));
    setAthletes(storageService.getAthletes());
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate || !editingTemplate.name.trim()) return;
    await storageService.saveTemplate(editingTemplate);
    await refreshData();
    setView('list');
    setEditingTemplate(null);
  };

  const handleCreateMesocycle = async () => {
      if (!assignTarget || selectedAthleteIds.length === 0 || projConfig.days.length === 0) {
          return alert("Selecciona al menos un atleta, días y plantilla.");
      }
      
      for (const athleteId of selectedAthleteIds) {
          const mesocycleSessions = storageService.cloneWithProgression(
              assignTarget, 
              athleteId,
              projConfig.weeks, 
              projConfig.incWeight, 
              projConfig.incReps
          );

          // Guardar cada sesión del meso en la nube / local
          for (const session of mesocycleSessions) {
              await storageService.saveTemplate(session);
          }

          mesocycleSessions.forEach((session, weekIdx) => {
              calendarService.projectMesocycle(
                  session, 
                  { id: athleteId } as any, 
                  projConfig.days, 
                  projConfig.startDate,
                  1, 
                  undefined,
                  weekIdx * 7
              );
          });
      }

      await refreshData();
      alert(`✅ Mesociclo de ${projConfig.weeks} semanas desplegado para ${selectedAthleteIds.length} atleta(s).`);
      setView('list');
      setSelectedAthleteIds([]);
  };

  const handleAssignDirect = async () => {
      if (!assignTarget || selectedAthleteIds.length === 0 || projConfig.days.length === 0) {
          return alert("Selecciona al menos un atleta y un día.");
      }
      
      for (const athleteId of selectedAthleteIds) {
          const instance: Workout = JSON.parse(JSON.stringify(assignTarget));
          instance.id = `direct-${athleteId}-${Date.now()}`;
          instance.assignedTo = athleteId;
          instance.isTemplate = false;
          
          await storageService.saveTemplate(instance);
          calendarService.projectMesocycle(
              instance, 
              { id: athleteId } as any, 
              projConfig.days, 
              projConfig.startDate, 
              projConfig.weeks
          );
      }
      
      alert(`✅ Rutina asignada y sincronizada para ${selectedAthleteIds.length} atleta(s).`);
      await refreshData();
      setView('list');
      setSelectedAthleteIds([]);
  };

  const WEEK_DAYS = [
      { id: 1, label: 'L' }, { id: 2, label: 'M' }, { id: 3, label: 'X' }, 
      { id: 4, label: 'J' }, { id: 5, label: 'V' }, { id: 6, label: 'S' }, { id: 0, label: 'D' }
  ];

  const toggleDay = (id: number) => {
    setProjConfig(prev => ({
        ...prev,
        days: prev.days.includes(id) ? prev.days.filter(d => d !== id) : [...prev.days, id]
    }));
  };

  return (
    <div className="pt-20 pb-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
       <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
             <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-2 animate-pulse">Kinetix Coach Pro</p>
             <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-tight">
                {view === 'list' ? 'Routine Manager' : view === 'editor' ? 'Protocol Editor' : view === 'meso' ? 'Meso Architect' : 'Assign Protocol'}
             </h1>
          </div>
          {view === 'list' && (
             <div className="flex gap-4">
                <button onClick={() => {setEditingTemplate({ id: `tpl-${Date.now()}`, name: '', publicTitle: '', category: 'general', day: 1, exercises: [], isTemplate: true }); setView('editor');}} className="bg-white/5 border border-white/10 hover:bg-white hover:text-black px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">+ MANUAL</button>
             </div>
          )}
          {view !== 'list' && (
             <button onClick={() => setView('list')} className="bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest">VOLVER</button>
          )}
       </div>

       {view === 'list' && (
         <div className="space-y-4">
            {templates.map(tpl => (
                <div key={tpl.id} className="group grid grid-cols-12 gap-4 items-center bg-[#0F0F11] border border-white/5 hover:border-white/20 p-6 rounded-3xl transition-all">
                    <div className="col-span-6 md:col-span-5">
                        <h3 className="text-xl font-black uppercase italic tracking-tight text-white">{tpl.name}</h3>
                    </div>
                    <div className="col-span-6 md:col-span-7 flex justify-end gap-3">
                        <button onClick={() => {setEditingTemplate({...tpl}); setView('editor');}} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white hover:text-black flex items-center justify-center text-sm border border-white/5 transition-all">✎</button>
                        <button onClick={() => {setAssignTarget(tpl); setView('meso');}} className="px-5 h-12 rounded-2xl bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white flex items-center justify-center text-[10px] font-black uppercase tracking-widest border border-blue-600/20 transition-all">🏗 MESO</button>
                        <button onClick={() => {setAssignTarget(tpl); setView('assign');}} className="w-12 h-12 rounded-2xl bg-green-600/10 hover:bg-green-600 text-green-500 hover:text-white flex items-center justify-center text-sm border border-green-600/20 transition-all">📅</button>
                    </div>
                </div>
            ))}
         </div>
       )}

       {(view === 'assign' || view === 'meso') && assignTarget && (
         <div className="animate-in zoom-in-95 max-w-xl mx-auto bg-[#0F0F11] border border-white/10 p-12 rounded-[50px] shadow-2xl">
            <h2 className="text-3xl font-black uppercase italic mb-8 tracking-tighter">{view === 'meso' ? 'Meso Architect' : 'Deploy Protocol'}</h2>
            <div className="space-y-8">
               <div className="space-y-3">
                   <div className="flex justify-between items-center">
                       <label className="text-[9px] font-black uppercase text-white/30 tracking-widest">Atletas Objetivo</label>
                       <div className="flex gap-2">
                           <button 
                               type="button"
                               onClick={() => setSelectedAthleteIds(athletes.map(a => a.id))} 
                               className="text-[9px] font-black text-red-500 uppercase tracking-wider bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                           >
                               Todos
                           </button>
                           <button 
                               type="button"
                               onClick={() => setSelectedAthleteIds([])} 
                               className="text-[9px] font-black text-white/40 uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/10 transition-all"
                           >
                               Ninguno
                           </button>
                       </div>
                   </div>
                   <div className="bg-black border border-white/10 rounded-3xl p-4 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                       {athletes.map(a => {
                           const isSelected = selectedAthleteIds.includes(a.id);
                           return (
                               <div 
                                   key={a.id} 
                                   onClick={() => {
                                       if (isSelected) {
                                           setSelectedAthleteIds(selectedAthleteIds.filter(id => id !== a.id));
                                       } else {
                                           setSelectedAthleteIds([...selectedAthleteIds, a.id]);
                                       }
                                   }}
                                   className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-red-600/10 border-red-600/40 text-white' : 'bg-white/[0.02] border-transparent hover:bg-white/5 text-white/60'}`}
                               >
                                   <span className="text-xs font-bold uppercase">{a.name}</span>
                                   <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-red-600 border-red-600' : 'border-white/20'}`}>
                                       {isSelected && <span className="text-[10px] font-bold text-white">✓</span>}
                                   </div>
                               </div>
                           );
                       })}
                       {athletes.length === 0 && (
                           <p className="text-center text-[10px] font-black uppercase text-white/20 py-4">No hay atletas registrados</p>
                       )}
                   </div>
               </div>
               
               <div className="space-y-4">
                   <label className="text-[9px] font-black uppercase text-white/30 tracking-widest block mb-2">Días Semanales (Marca los 7 días si quieres)</label>
                   <div className="flex justify-between gap-2">
                       {WEEK_DAYS.map(d => (
                           <button 
                                key={d.id} 
                                onClick={() => toggleDay(d.id)} 
                                className={`w-12 h-12 rounded-xl text-[10px] font-black transition-all ${projConfig.days.includes(d.id) ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-white/30'}`}
                           >
                               {d.label}
                           </button>
                       ))}
                   </div>
               </div>

               <button 
                  onClick={view === 'meso' ? handleCreateMesocycle : handleAssignDirect} 
                  className="w-full py-6 bg-red-600 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-red-500 transition-all"
               >
                   {view === 'meso' ? 'GENERAR MESOCICLO' : 'ASIGNAR AL CALENDARIO'}
               </button>
            </div>
         </div>
       )}

       {view === 'editor' && editingTemplate && (
           <div className="animate-in slide-in-from-bottom-10 space-y-8">
               <div className="bg-[#0F0F11] border border-white/5 rounded-[40px] p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-[9px] font-black uppercase text-white/20 tracking-widest block mb-2">Nombre Master</label>
                            <input type="text" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-xl font-black italic uppercase text-white" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
                        </div>
                    </div>
               </div>
               {/* Contenido de edición de bloques */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center px-4">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/30 italic">Bloques de Entrenamiento ({editingTemplate.exercises?.length || 0})</h2>
                        <button 
                            type="button"
                            onClick={() => {
                                const allExs = storageService.getExercises();
                                const firstEx = allExs[0] || { id: 'ex-1', name: 'Exercise', muscleGroup: 'General', videoUrl: '' };
                                const newEx: WorkoutExercise = {
                                    exerciseId: firstEx.id,
                                    name: firstEx.name,
                                    targetSets: 3,
                                    targetReps: '10',
                                    targetLoad: '0',
                                    targetRest: 60,
                                    method: 'standard',
                                    videoUrl: firstEx.videoUrl
                                };
                                setEditingTemplate({
                                    ...editingTemplate,
                                    exercises: [...(editingTemplate.exercises || []), newEx]
                                });
                            }} 
                            className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            + AÑADIR EJERCICIO
                        </button>
                    </div>

                    <div className="space-y-4">
                        {(editingTemplate.exercises || []).map((ex, idx) => (
                            <div key={idx} className="relative">
                                <div className="absolute top-4 right-4 z-10">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            const filtered = editingTemplate.exercises.filter((_, i) => i !== idx);
                                            setEditingTemplate({ ...editingTemplate, exercises: filtered });
                                        }} 
                                        className="bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border border-red-500/10 transition-all"
                                    >
                                        Eliminar Bloque
                                    </button>
                                </div>
                                <ExerciseBlockEditor 
                                    exercise={ex} 
                                    onUpdate={(updated) => {
                                        const newExs = [...editingTemplate.exercises];
                                        newExs[idx] = updated;
                                        setEditingTemplate({ ...editingTemplate, exercises: newExs });
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {(!editingTemplate.exercises || editingTemplate.exercises.length === 0) && (
                        <div className="text-center py-16 border border-dashed border-white/5 rounded-[40px]">
                            <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">No hay ejercicios en esta rutina.</p>
                            <button 
                                type="button"
                                onClick={() => {
                                    const allExs = storageService.getExercises();
                                    const firstEx = allExs[0] || { id: 'ex-1', name: 'Exercise', muscleGroup: 'General', videoUrl: '' };
                                    const newEx: WorkoutExercise = {
                                        exerciseId: firstEx.id,
                                        name: firstEx.name,
                                        targetSets: 3,
                                        targetReps: '10',
                                        targetLoad: '0',
                                        targetRest: 60,
                                        method: 'standard',
                                        videoUrl: firstEx.videoUrl
                                    };
                                    setEditingTemplate({
                                        ...editingTemplate,
                                        exercises: [newEx]
                                    });
                                }} 
                                className="mt-4 bg-white/5 border border-white/10 hover:bg-white hover:text-black text-white px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                + AÑADIR PRIMER EJERCICIO
                            </button>
                        </div>
                    )}
                </div>
               <button onClick={handleSaveTemplate} className="w-full py-8 bg-green-600 rounded-[40px] text-[10px] font-black uppercase tracking-[0.5em] text-white">GUARDAR MASTER TEMPLATE</button>
           </div>
       )}
    </div>
  );
};
