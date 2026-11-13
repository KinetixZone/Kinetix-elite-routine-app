import React, { useState, useEffect, useRef } from 'react';
import { Workout, WorkoutExercise, User } from '../../types/kinetix';
import { storageService } from '../../services/storageService';
import { calendarService } from '../../services/calendarService';
import { ExerciseBlockEditor } from './ExerciseBlockEditor';
import { ExerciseLibrary } from '../admin/ExerciseLibrary';
import { exportWorkoutsToCSV, downloadWorkoutsTemplateCSV, parseWorkoutsFromCSV } from '../../lib/csvExport';

export const WorkoutManager: React.FC = () => {
  const [view, setView] = useState<'list' | 'editor' | 'assign' | 'meso' | 'library'>('list');
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [listUndoStack, setListUndoStack] = useState<Workout[][]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Workout | null>(null);
  const [editorUndoStack, setEditorUndoStack] = useState<Workout[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [assignTarget, setAssignTarget] = useState<Workout | null>(null);
  const [athletes, setAthletes] = useState<User[]>([]);
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [exerciseCount, setExerciseCount] = useState<number>(0);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'general' | 'travel' | 'personalizado'>('all');
  const [projConfig, setProjConfig] = useState({ 
    startDate: new Date().toISOString().split('T')[0], 
    weeks: 4, 
    days: [] as number[], 
    incWeight: 2.5, 
    incReps: 0 
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { refreshData(); }, []);

  const refreshData = async () => {
    const [all, cloudAthletes] = await Promise.all([
      storageService.getTemplates(),
      storageService.syncAthletesFromCloud()
    ]);
    setTemplates(all.filter(t => t.isTemplate !== false));
    setAthletes(cloudAthletes.filter(a => a.role !== 'owner'));
    setExerciseCount(storageService.getExercises().length);
  };

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const pushListUndo = (snapshot: Workout[]) => {
    setListUndoStack(prev => [...prev.slice(-10), JSON.parse(JSON.stringify(snapshot))]);
  };

  const handleListUndo = async () => {
    if (listUndoStack.length === 0) return;
    const prev = listUndoStack[listUndoStack.length - 1];
    setListUndoStack(s => s.slice(0, -1));
    await storageService.replaceAllTemplates(prev);
    await refreshData();
    notify('↩ Cambio en rutinas deshecho.');
  };

  const updateEditingWithUndo = (nextTemplate: Workout) => {
    if (editingTemplate) {
      setEditorUndoStack(prev => [...prev.slice(-15), JSON.parse(JSON.stringify(editingTemplate))]);
    }
    setEditingTemplate(nextTemplate);
  };

  const handleEditorUndo = () => {
    if (editorUndoStack.length === 0) return;
    const prev = editorUndoStack[editorUndoStack.length - 1];
    setEditorUndoStack(s => s.slice(0, -1));
    setEditingTemplate(prev);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate || !editingTemplate.name.trim()) {
      setErrorMsg('Ingresa un nombre para la rutina antes de guardar.');
      setTimeout(() => setErrorMsg(null), 3500);
      return;
    }
    pushListUndo(templates);
    await storageService.saveTemplate(editingTemplate);
    await refreshData();
    setView('list');
    setEditingTemplate(null);
    setEditorUndoStack([]);
    notify(`✅ Rutina "${editingTemplate.name}" guardada y sincronizada.`);
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    pushListUndo(templates);
    await storageService.deleteTemplate(id);
    setConfirmDeleteId(null);
    await refreshData();
    notify(`🗑 Rutina "${name}" eliminada. Puedes usar "Deshacer" para recuperarla.`);
  };

  const handleDuplicateTemplate = async (tpl: Workout) => {
    pushListUndo(templates);
    const copy: Workout = JSON.parse(JSON.stringify(tpl));
    copy.id = `tpl-${Date.now()}`;
    copy.name = `${tpl.name} (Copia)`;
    copy.isTemplate = true;
    await storageService.saveTemplate(copy);
    await refreshData();
    notify(`📑 Rutina duplicada: "${copy.name}".`);
  };

  const handleImportWorkoutsCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const imported = parseWorkoutsFromCSV(text, storageService.getExercises());
      if (imported.length === 0) {
        setErrorMsg('No se encontraron rutinas válidas en el archivo Excel/CSV.');
        setTimeout(() => setErrorMsg(null), 3500);
        return;
      }
      pushListUndo(templates);
      for (const w of imported) {
        await storageService.saveTemplate(w);
      }
      await refreshData();
      notify(`📊 Excel importado: ${imported.length} rutina(s) cargadas correctamente.`);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleCreateMesocycle = async () => {
      if (!assignTarget || selectedAthleteIds.length === 0 || projConfig.days.length === 0) {
          setErrorMsg("Selecciona al menos un atleta, días de la semana y plantilla.");
          setTimeout(() => setErrorMsg(null), 3500);
          return;
      }
      
      for (const athleteId of selectedAthleteIds) {
          const mesocycleSessions = storageService.cloneWithProgression(
              assignTarget, 
              athleteId,
              projConfig.weeks, 
              projConfig.incWeight, 
              projConfig.incReps
          );

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
      notify(`✅ Mesociclo de ${projConfig.weeks} semanas desplegado para ${selectedAthleteIds.length} atleta(s).`);
      setView('list');
      setSelectedAthleteIds([]);
  };

  const handleAssignDirect = async () => {
      if (!assignTarget || selectedAthleteIds.length === 0 || projConfig.days.length === 0) {
          setErrorMsg("Selecciona al menos un atleta y un día de la semana.");
          setTimeout(() => setErrorMsg(null), 3500);
          return;
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
      
      notify(`✅ Rutina asignada y sincronizada para ${selectedAthleteIds.length} atleta(s).`);
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

  const moveBlock = (idx: number, direction: -1 | 1) => {
    if (!editingTemplate) return;
    const arr = [...editingTemplate.exercises];
    const target = idx + direction;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    updateEditingWithUndo({ ...editingTemplate, exercises: arr });
  };

  const addBlock = () => {
    if (!editingTemplate) return;
    const allExs = storageService.getExercises();
    const firstEx = allExs[0] || { id: 'ex-1', name: 'Press Horizontal', muscleGroup: 'Pecho', videoUrl: '', technique: '' };
    const newEx: WorkoutExercise = {
        exerciseId: firstEx.id,
        name: firstEx.name,
        targetSets: 3,
        targetReps: '10',
        targetLoad: '0',
        targetRest: 90,
        targetRir: '2',
        tempo: '3-0-1-0',
        setType: 'straight',
        coachCue: firstEx.technique,
        method: 'standard',
        videoUrl: firstEx.videoUrl
    };
    updateEditingWithUndo({
        ...editingTemplate,
        exercises: [...(editingTemplate.exercises || []), newEx]
    });
  };

  return (
    <div className="pt-20 pb-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
       <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
          <div>
             <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-1">Control Total Coach & Dueña</p>
             <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-tight">
                {view === 'list' ? 'Gestor de Rutinas' : view === 'editor' ? 'Diseñador de Rutinas' : view === 'meso' ? 'Planificador de Mesociclos' : view === 'library' ? 'Biblioteca de Ejercicios' : 'Asignar Rutina'}
             </h1>
          </div>
          {view === 'list' && (
             <div className="flex flex-wrap gap-2.5">
                {listUndoStack.length > 0 && (
                  <button
                    onClick={handleListUndo}
                    className="px-4 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-[10px] font-black uppercase tracking-wider transition-all min-h-[44px]"
                  >
                    ↩ Deshacer ({listUndoStack.length})
                  </button>
                )}
                <button
                  onClick={() => downloadWorkoutsTemplateCSV()}
                  className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[10px] font-black uppercase tracking-wider transition-all min-h-[44px]"
                >
                  📄 Plantilla Excel
                </button>
                <input type="file" accept=".csv,text/csv" ref={csvInputRef} onChange={handleImportWorkoutsCSV} className="hidden" />
                <button
                  onClick={() => csvInputRef.current?.click()}
                  className="px-4 py-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/40 text-[10px] font-black uppercase tracking-wider transition-all min-h-[44px]"
                >
                  ⬆ Subir Excel
                </button>
                <button
                  onClick={() => {
                    exportWorkoutsToCSV(templates);
                    notify('📥 Rutinas exportadas a Excel (.csv).');
                  }}
                  className="px-4 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider transition-all min-h-[44px]"
                >
                  ⬇ Exportar Excel
                </button>
                <button 
                  onClick={() => setView('library')} 
                  className="bg-red-600/15 border border-red-500/40 text-red-300 hover:bg-red-600 hover:text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 min-h-[44px]"
                >
                  <span>📚</span> Ejercicios ({exerciseCount})
                </button>
                <button 
                  onClick={() => {
                    setEditorUndoStack([]);
                    setEditingTemplate({ id: `tpl-${Date.now()}`, name: '', publicTitle: '', category: 'general', day: 1, exercises: [], isTemplate: true }); 
                    setView('editor');
                  }} 
                  className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all min-h-[44px]"
                >
                  + Nueva Rutina
                </button>
             </div>
          )}
          {view !== 'list' && (
             <div className="flex gap-2">
                {view === 'editor' && editorUndoStack.length > 0 && (
                  <button
                    onClick={handleEditorUndo}
                    className="px-4 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-[10px] font-black uppercase tracking-wider transition-all min-h-[44px]"
                  >
                    ↩ Deshacer Edición ({editorUndoStack.length})
                  </button>
                )}
                <button onClick={() => { setView('list'); refreshData(); }} className="bg-white/5 border border-white/10 hover:bg-white hover:text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-h-[44px]">← VOLVER</button>
             </div>
          )}
       </div>

       {/* NOTIFICACIONES TOAST & ERROR */}
       {toastMsg && (
         <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-black uppercase tracking-wider animate-in fade-in flex items-center justify-between">
           <span>{toastMsg}</span>
           <button onClick={() => setToastMsg(null)} className="text-white/40 hover:text-white text-xs px-2">✕</button>
         </div>
       )}
       {errorMsg && (
         <div className="mb-6 p-4 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider animate-in fade-in flex items-center justify-between">
           <span>⚠️ {errorMsg}</span>
           <button onClick={() => setErrorMsg(null)} className="text-white/40 hover:text-white text-xs px-2">✕</button>
         </div>
       )}

       {view === 'list' && (
         <div className="space-y-6">
            <div className="flex bg-white/5 rounded-2xl p-1 gap-1 overflow-x-auto no-scrollbar">
               {[
                 { id: 'all', label: 'Todas las Rutinas' },
                 { id: 'travel', label: '🏖️ Vacaciones / Viaje' },
                 { id: 'personalizado', label: '⭐ Personalizados Jorge' },
                 { id: 'general', label: 'Pesas & Funcional' }
               ].map(cat => (
                 <button 
                   key={cat.id} 
                   onClick={() => setCategoryFilter(cat.id as any)}
                   className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${categoryFilter === cat.id ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                 >
                   {cat.label}
                 </button>
               ))}
            </div>

            <div className="space-y-3">
               {templates
                 .filter(tpl => {
                   if (categoryFilter === 'all') return true;
                   if (categoryFilter === 'travel') return tpl.category === 'travel' || tpl.name.toLowerCase().includes('viaje') || tpl.name.toLowerCase().includes('vacaciones');
                   if (categoryFilter === 'personalizado') return tpl.category === 'personalizado' || tpl.name.toLowerCase().includes('personalizado');
                   return tpl.category === categoryFilter;
                 })
                 .map(tpl => (
                   <div key={tpl.id} className="group flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0F0F11] border border-white/10 hover:border-white/25 p-5 md:p-6 rounded-3xl transition-all">
                       <div className="space-y-1">
                           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
                              <span className={tpl.category === 'travel' ? 'text-cyan-400' : tpl.category === 'personalizado' ? 'text-amber-400' : 'text-red-400'}>
                                {tpl.category === 'travel' ? '🏖️ Vacaciones' : tpl.category === 'personalizado' ? '⭐ Jorge 1-on-1' : 'Kinetix Master'}
                              </span>
                              <span>·</span>
                              <span>{tpl.exercises?.length || 0} Ejercicios</span>
                           </div>
                           <h3 className="text-xl font-black uppercase italic tracking-tight text-white">{tpl.name}</h3>
                           {tpl.publicTitle && tpl.publicTitle !== tpl.name && (
                             <p className="text-[10px] text-white/35">Vista Atleta: {tpl.publicTitle}</p>
                           )}
                       </div>
                       <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                           {confirmDeleteId === tpl.id ? (
                             <div className="flex items-center gap-2 bg-red-950/80 border border-red-600/50 px-3 py-2 rounded-xl">
                               <span className="text-[9px] font-black text-red-200 uppercase">¿Eliminar rutina?</span>
                               <button onClick={() => handleDeleteTemplate(tpl.id, tpl.name)} className="px-3 py-1 bg-red-600 text-white text-[9px] font-black rounded-lg uppercase">Sí, Borrar</button>
                               <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-1 bg-white/10 text-white text-[9px] font-black rounded-lg uppercase">Cancelar</button>
                             </div>
                           ) : (
                             <>
                               <button onClick={() => { setEditorUndoStack([]); setEditingTemplate(JSON.parse(JSON.stringify(tpl))); setView('editor'); }} className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black text-[10px] font-black uppercase tracking-wider transition-all min-h-[42px]" title="Editar">✎ Editar</button>
                               <button onClick={() => handleDuplicateTemplate(tpl)} className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-[10px] font-black uppercase tracking-wider border border-white/10 transition-all min-h-[42px]" title="Duplicar">📑 Clonar</button>
                               <button onClick={() => {setAssignTarget(tpl); setView('meso');}} className="px-3.5 py-2.5 rounded-xl bg-blue-600/15 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-black uppercase tracking-wider border border-blue-500/30 transition-all min-h-[42px]">🏗 Meso</button>
                               <button onClick={() => {setAssignTarget(tpl); setView('assign');}} className="px-3.5 py-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 transition-all min-h-[42px]">📅 Asignar</button>
                               <button onClick={() => setConfirmDeleteId(tpl.id)} className="px-3 py-2.5 rounded-xl bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white text-[10px] font-black uppercase border border-red-500/20 transition-all min-h-[42px]" title="Eliminar">🗑</button>
                             </>
                           )}
                       </div>
                   </div>
               ))}
            </div>
         </div>
       )}

       {(view === 'assign' || view === 'meso') && assignTarget && (
         <div className="animate-in zoom-in-95 max-w-xl mx-auto bg-[#0F0F11] border border-white/10 p-8 md:p-10 rounded-[40px] shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-black uppercase italic mb-2 tracking-tighter">{view === 'meso' ? 'Planificador de Mesociclo' : 'Asignar Rutina a Atletas'}</h2>
            <p className="text-xs text-cyan-400 font-bold mb-6">Rutina: {assignTarget.name}</p>
            <div className="space-y-6">
               <div className="space-y-3">
                   <div className="flex justify-between items-center">
                       <label className="text-[9px] font-black uppercase text-white/40 tracking-widest">Atletas Objetivo</label>
                       <div className="flex gap-2">
                           <button type="button" onClick={() => setSelectedAthleteIds(athletes.map(a => a.id))} className="text-[9px] font-black text-red-400 uppercase tracking-wider bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Todos</button>
                           <button type="button" onClick={() => setSelectedAthleteIds([])} className="text-[9px] font-black text-white/50 uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">Ninguno</button>
                       </div>
                   </div>
                   <div className="bg-black border border-white/10 rounded-3xl p-4 max-h-52 overflow-y-auto custom-scrollbar space-y-2">
                       {athletes.map(a => {
                           const isSelected = selectedAthleteIds.includes(a.id);
                           return (
                               <div 
                                   key={a.id} 
                                   onClick={() => setSelectedAthleteIds(isSelected ? selectedAthleteIds.filter(id => id !== a.id) : [...selectedAthleteIds, a.id])}
                                   className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-red-600/15 border-red-600/50 text-white' : 'bg-white/[0.02] border-transparent hover:bg-white/5 text-white/60'}`}
                               >
                                   <div className="min-w-0 pr-2">
                                     <span className="text-xs font-bold uppercase block truncate">{a.name}</span>
                                     <span className="text-[10px] font-mono text-cyan-400/80">
                                       @{a.username || a.email.split('@')[0]} {a.isUnlimited ? '· ∞ Sin Corte' : ''} {a.isActive === false ? '· PAUSADO' : ''}
                                     </span>
                                   </div>
                                   <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${isSelected ? 'bg-red-600 border-red-600' : 'border-white/20'}`}>
                                       {isSelected && <span className="text-[10px] font-bold text-white">✓</span>}
                                   </div>
                               </div>
                           );
                       })}
                   </div>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-white/40 tracking-widest block">Fecha de Inicio</label>
                   <input type="date" value={projConfig.startDate} onChange={e => setProjConfig({...projConfig, startDate: e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-bold text-white" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] font-black uppercase text-white/40 tracking-widest block">Duración (Semanas)</label>
                   <input type="number" min={1} max={12} value={projConfig.weeks} onChange={e => setProjConfig({...projConfig, weeks: parseInt(e.target.value) || 1})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-bold text-white" />
                 </div>
               </div>

               <div className="space-y-3">
                   <label className="text-[9px] font-black uppercase text-white/40 tracking-widest block">Días Semanales</label>
                   <div className="flex justify-between gap-2">
                       {WEEK_DAYS.map(d => (
                           <button key={d.id} onClick={() => toggleDay(d.id)} className={`w-12 h-12 rounded-xl text-[10px] font-black transition-all ${projConfig.days.includes(d.id) ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-white/40'}`}>
                               {d.label}
                           </button>
                       ))}
                   </div>
               </div>

               {view === 'meso' && (
                 <div className="grid grid-cols-1 gap-3">
                   <div>
                     <label className="text-[9px] font-black uppercase text-white/40 block mb-1">Sobrecarga Progresiva (+KG por semana)</label>
                     <input type="number" step="0.5" value={projConfig.incWeight} onChange={e => setProjConfig({...projConfig, incWeight: parseFloat(e.target.value) || 0})} className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-bold text-white" />
                   </div>
                 </div>
               )}

               <button onClick={view === 'meso' ? handleCreateMesocycle : handleAssignDirect} className="w-full py-5 bg-red-600 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-red-500 transition-all">
                   {view === 'meso' ? 'GENERAR MESOCICLO' : 'ASIGNAR AL CALENDARIO'}
               </button>
            </div>
         </div>
       )}

       {view === 'editor' && editingTemplate && (
           <div className="animate-in slide-in-from-bottom-10 space-y-6">
               <div className="bg-[#0F0F11] border border-white/10 rounded-[32px] p-6 md:p-8 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-[9px] font-black uppercase text-white/40 tracking-widest block mb-1.5">Nombre Interno (Coach)</label>
                            <input type="text" className="w-full bg-black border border-white/10 rounded-xl p-4 text-base font-black italic uppercase text-white outline-none focus:border-red-500" value={editingTemplate.name} onChange={e => updateEditingWithUndo({...editingTemplate, name: e.target.value})} placeholder="Ej: Torso Fuerza A" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-white/40 tracking-widest block mb-1.5">Título Visible para Atleta</label>
                            <input type="text" className="w-full bg-black border border-white/10 rounded-xl p-4 text-base font-bold text-white outline-none focus:border-cyan-500" value={editingTemplate.publicTitle || ''} onChange={e => updateEditingWithUndo({...editingTemplate, publicTitle: e.target.value})} placeholder="Ej: Empuje & Tracción" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-white/40 tracking-widest block mb-1.5">Categoría</label>
                            <select 
                              value={editingTemplate.category || 'general'} 
                              onChange={e => updateEditingWithUndo({...editingTemplate, category: e.target.value as any})}
                              className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-red-500"
                            >
                              <option value="general">Pesas & Funcional</option>
                              <option value="personalizado">⭐ Personalizado Jorge</option>
                              <option value="travel">🏖️ Vacaciones / Viaje</option>
                            </select>
                        </div>
                    </div>
               </div>

               <div className="space-y-4">
                   <div className="flex justify-between items-center px-2">
                       <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/50">Bloques ({editingTemplate.exercises?.length || 0})</h2>
                       <button type="button" onClick={addBlock} className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-h-[44px]">
                           + Añadir Ejercicio
                       </button>
                   </div>

                   <div className="space-y-4">
                       {(editingTemplate.exercises || []).map((ex, idx) => (
                           <div key={idx} className="relative bg-[#0B0B0E] rounded-[32px] border border-white/5 p-2">
                               <div className="flex justify-end gap-2 px-3 pt-2 pb-1">
                                   <button type="button" onClick={() => moveBlock(idx, -1)} disabled={idx === 0} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 text-xs font-black text-white">↑ Subir</button>
                                   <button type="button" onClick={() => moveBlock(idx, 1)} disabled={idx === editingTemplate.exercises.length - 1} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 text-xs font-black text-white">↓ Bajar</button>
                                   <button 
                                       type="button"
                                       onClick={() => {
                                           const filtered = editingTemplate.exercises.filter((_, i) => i !== idx);
                                           updateEditingWithUndo({ ...editingTemplate, exercises: filtered });
                                       }} 
                                       className="bg-red-900/25 hover:bg-red-600 text-red-400 hover:text-white px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-red-500/20 transition-all"
                                   >
                                       Eliminar Bloque
                                   </button>
                               </div>
                               <ExerciseBlockEditor 
                                   exercise={ex} 
                                   onUpdate={(updated) => {
                                       const newExs = [...editingTemplate.exercises];
                                       newExs[idx] = updated;
                                       updateEditingWithUndo({ ...editingTemplate, exercises: newExs });
                                   }}
                               />
                           </div>
                       ))}
                   </div>

                   {(!editingTemplate.exercises || editingTemplate.exercises.length === 0) && (
                       <div className="text-center py-14 border border-dashed border-white/10 rounded-[32px]">
                           <p className="text-xs font-black uppercase text-white/30 tracking-widest">No hay ejercicios en esta rutina.</p>
                           <button type="button" onClick={addBlock} className="mt-4 bg-white/10 hover:bg-white hover:text-black text-white px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                               + Añadir Primer Ejercicio
                           </button>
                       </div>
                   )}
               </div>

               <button onClick={handleSaveTemplate} className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 rounded-[28px] text-xs font-black uppercase tracking-[0.4em] text-white shadow-xl transition-all">
                 GUARDAR RUTINA MASTER
               </button>
           </div>
       )}

       {view === 'library' && (
         <div className="space-y-6 animate-in fade-in duration-300">
           <ExerciseLibrary isEmbedded={true} />
         </div>
       )}
    </div>
  );
};
