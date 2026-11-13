import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Exercise } from '../../types/kinetix';
import { storageService } from '../../services/storageService';
import { getYoutubeEmbedUrl, getYoutubeVideoId } from '../../lib/youtube';
import { exportExercisesToCSV, downloadExercisesTemplateCSV, parseExercisesFromCSV } from '../../lib/csvExport';

// --- SUB-COMPONENT: VIDEO MODAL ---
const ExerciseVideoModal: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
  if (!url) return null;
  const embedUrl = getYoutubeEmbedUrl(url, true);

  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
       <div className="relative w-full max-w-3xl flex flex-col gap-4 bg-[#0F0F11] border border-white/10 p-6 rounded-[36px] shadow-2xl">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Demostración Técnica YouTube</h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 text-white flex items-center justify-center font-bold transition-colors">✕</button>
          </div>

          <div className="relative aspect-video bg-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
             {embedUrl ? (
                <iframe 
                  className="w-full h-full"
                  src={embedUrl}
                  title="Demostración Técnica"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
             ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 text-xs uppercase font-black p-6 text-center">
                    <p>Error: ID de video no válido</p>
                    <a href={url} target="_blank" rel="noreferrer" className="mt-3 px-4 py-2 bg-red-600 rounded-xl text-white">
                      Abrir enlace original
                    </a>
                </div>
             )}
          </div>
          
          <div className="flex justify-between items-center text-[9px] text-white/30 uppercase tracking-widest pt-1">
              <span>Reproductor Optimizado Kinetix</span>
              <a href={url} target="_blank" rel="noreferrer" className="text-red-400 hover:text-white uppercase font-bold">
                Ver en YouTube ↗
              </a>
          </div>
       </div>
    </div>
  );
};

// --- SUB-COMPONENT: EDIT MODAL ---
const ExerciseEditModal: React.FC<{ exercise?: Exercise; onClose: () => void; onSave: (ex: Exercise) => void }> = ({ exercise, onClose, onSave }) => {
  const [formData, setFormData] = useState<Exercise>(exercise || {
    id: `ex-${Date.now()}`,
    name: '',
    muscleGroup: 'Pecho',
    videoUrl: '',
    technique: '',
    commonErrors: []
  });
  const [errorsText, setErrorsText] = useState((exercise?.commonErrors || []).join(' | '));
  const [formErr, setFormErr] = useState<string | null>(null);

  const muscleGroups = ['Pecho', 'Espalda', 'Piernas', 'Bíceps', 'Tríceps', 'Hombro', 'Glúteo', 'Abdomen', 'Funcional', 'Halterofilia'];
  const validId = getYoutubeVideoId(formData.videoUrl);

  const handleSaveClick = () => {
    if (!formData.name.trim()) {
      setFormErr('Ingresa el nombre del ejercicio.');
      return;
    }
    onSave({
      ...formData,
      name: formData.name.trim(),
      videoUrl: formData.videoUrl.trim(),
      technique: formData.technique.trim(),
      commonErrors: errorsText.split('|').map(s => s.trim()).filter(Boolean)
    });
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in slide-in-from-bottom-10 duration-300">
      <div className="bg-[#0F0F11] w-full max-w-lg rounded-t-[32px] md:rounded-[32px] border border-white/10 p-6 md:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
            {exercise ? 'Editar Ejercicio & Link' : 'Nuevo Ejercicio'}
          </h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 text-white flex items-center justify-center">✕</button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest block mb-1">Nombre del Ejercicio</label>
            <input type="text" className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-white font-bold text-sm outline-none focus:border-red-600" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Press Militar" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest block mb-1">Grupo Muscular</label>
            <select className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-white font-bold text-sm outline-none focus:border-red-600" value={formData.muscleGroup} onChange={e => setFormData({...formData, muscleGroup: e.target.value})}>
               {muscleGroups.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest block mb-1">Link YouTube (Normal / Shorts / Embed)</label>
            <input type="text" className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-cyan-300 font-mono text-xs outline-none focus:border-cyan-500" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="https://youtube.com/watch?v=..." />
            {formData.videoUrl && (
                validId 
                ? <p className="text-[9px] text-green-400 mt-1 font-bold">✓ Link válido • ID: {validId}</p>
                : <p className="text-[9px] text-amber-400 mt-1 font-bold">⚠ Link personalizado o formato no estándar</p>
            )}
          </div>
          <div>
             <label className="text-[10px] font-black uppercase text-white/40 tracking-widest block mb-1">Técnica (Cue Biomecánico)</label>
             <textarea className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-white font-medium text-xs h-20 outline-none focus:border-red-600" value={formData.technique} onChange={e => setFormData({...formData, technique: e.target.value})} placeholder="Ej: Retracción escapular y descenso controlado 3 seg..." />
          </div>
          <div>
             <label className="text-[10px] font-black uppercase text-white/40 tracking-widest block mb-1">Errores Comunes (separados por | )</label>
             <input type="text" className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-white/80 font-medium text-xs outline-none focus:border-red-600" value={errorsText} onChange={e => setErrorsText(e.target.value)} placeholder="Ej: Elevar hombros | Arquear lumbar" />
          </div>
        </div>

        {formErr && <p className="text-xs text-red-400 font-bold">{formErr}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest text-white">Cancelar</button>
          <button onClick={handleSaveClick} className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest shadow-lg">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export const ExerciseLibrary: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded = false }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [undoStack, setUndoStack] = useState<Exercise[][]>([]);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [viewVideo, setViewVideo] = useState<string | null>(null);
  const [editingEx, setEditingEx] = useState<Exercise | undefined | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setExercises(storageService.getExercises());
  }, []);

  const showToast = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const pushUndoSnapshot = (currentList: Exercise[]) => {
    setUndoStack(prev => [...prev.slice(-14), JSON.parse(JSON.stringify(currentList))]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    storageService.saveExercises(previousState);
    setExercises(previousState);
    showToast('↩ Cambio deshecho. Catálogo restaurado.');
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(exercises.map(e => e.muscleGroup)));
    return ['Todos', ...cats.sort()];
  }, [exercises]);

  const filteredList = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) || ex.muscleGroup.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'Todos' || ex.muscleGroup === filter;
      return matchesSearch && matchesFilter;
    });
  }, [exercises, filter, search]);

  const handleDelete = (id: string) => {
    pushUndoSnapshot(exercises);
    const target = exercises.find(e => e.id === id);
    storageService.deleteExercise(id);
    setExercises(storageService.getExercises());
    setConfirmDeleteId(null);
    showToast(`🗑 "${target?.name || 'Ejercicio'}" eliminado. Puedes usar Deshacer.`);
  };

  const handleSave = (ex: Exercise) => {
    pushUndoSnapshot(exercises);
    storageService.addOrUpdateExercise(ex);
    setExercises(storageService.getExercises());
    setEditingEx(null);
    showToast(`✅ "${ex.name}" guardado correctamente.`);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const imported = parseExercisesFromCSV(text);
      if (imported.length === 0) {
        showToast('⚠️ No se detectaron ejercicios válidos en el CSV.');
        return;
      }
      pushUndoSnapshot(exercises);
      const mergedMap = new Map(exercises.map(ex => [ex.name.toLowerCase(), ex]));
      imported.forEach(item => {
        const existing = mergedMap.get(item.name.toLowerCase());
        if (existing) {
          mergedMap.set(item.name.toLowerCase(), {
            ...existing,
            muscleGroup: item.muscleGroup || existing.muscleGroup,
            videoUrl: item.videoUrl || existing.videoUrl,
            technique: item.technique || existing.technique,
            commonErrors: item.commonErrors.length > 0 ? item.commonErrors : existing.commonErrors
          });
        } else {
          mergedMap.set(item.name.toLowerCase(), item);
        }
      });
      const updated = Array.from(mergedMap.values());
      storageService.saveExercises(updated);
      setExercises(updated);
      showToast(`📊 Excel importado: ${imported.length} ejercicios cargados/actualizados.`);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const containerClasses = isEmbedded
    ? "space-y-6"
    : "pt-20 pb-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen";

  return (
    <div className={containerClasses}>
       {/* HEADER & CONTROL TOTAL + EXCEL TOOLS */}
       <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-6 gap-4">
          <div>
             <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.3em] mb-1">Control Total Coach & Dueña</p>
             <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
               Biblioteca de Ejercicios
             </h1>
             <p className="text-xs text-white/40 mt-1">{filteredList.length} de {exercises.length} ejercicios • Edita links, técnicas o sube tu Excel</p>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
             {undoStack.length > 0 && (
               <button 
                 onClick={handleUndo}
                 className="px-4 py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 text-[10px] font-black uppercase tracking-wider transition-all min-h-[44px]"
               >
                 ↩ Deshacer ({undoStack.length})
               </button>
             )}

             <button 
               onClick={() => downloadExercisesTemplateCSV()}
               className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[10px] font-black uppercase tracking-wider transition-all min-h-[44px]"
               title="Descargar plantilla CSV para llenar en Excel"
             >
               📄 Plantilla Excel
             </button>

             <input 
               type="file" 
               accept=".csv,text/csv" 
               ref={fileInputRef} 
               onChange={handleImportCSV} 
               className="hidden" 
             />
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="px-4 py-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/40 text-[10px] font-black uppercase tracking-wider transition-all min-h-[44px]"
             >
               ⬆ Subir Excel (.csv)
             </button>

             <button 
               onClick={() => {
                 exportExercisesToCSV(exercises);
                 showToast('📥 Archivo Excel (.csv) exportado con éxito.');
               }}
               className="px-4 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider transition-all min-h-[44px]"
             >
               ⬇ Exportar Excel
             </button>

             <button 
               onClick={() => setEditingEx(undefined)}
               className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 min-h-[44px]"
             >
               + Nuevo Ejercicio
             </button>
          </div>
       </div>

       {statusMsg && (
         <div className="mb-4 p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs font-bold flex items-center justify-between animate-in fade-in">
           <span>{statusMsg}</span>
           <button onClick={() => setStatusMsg(null)} className="text-white/50 hover:text-white px-2">✕</button>
         </div>
       )}

       {/* SEARCH & FILTER BAR */}
       <div className="sticky top-0 z-30 bg-[#050507]/95 backdrop-blur-xl py-4 -mx-4 px-4 md:mx-0 md:px-0 border-b border-white/5 mb-6 space-y-3">
          <div className="relative">
             <input 
               type="text" 
               placeholder="Buscar ejercicio por nombre o grupo muscular..." 
               className="w-full bg-[#0F0F11] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white font-bold placeholder-white/30 focus:border-red-600 outline-none transition-colors"
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
             {categories.map(cat => (
               <button 
                 key={cat} 
                 onClick={() => setFilter(cat)}
                 className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all min-h-[38px] ${filter === cat ? 'bg-white text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
               >
                 {cat}
               </button>
             ))}
          </div>
       </div>

       {/* GRID */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map(ex => (
            <div key={ex.id} className="bg-[#0F0F11] border border-white/10 rounded-[24px] p-5 hover:border-white/25 transition-colors flex flex-col justify-between gap-4">
               <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                     <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">{ex.muscleGroup}</span>
                     <div className="flex gap-1.5 items-center">
                        {confirmDeleteId === ex.id ? (
                          <div className="flex items-center gap-1.5 bg-red-950/90 border border-red-600/60 px-2.5 py-1 rounded-xl">
                             <span className="text-[9px] font-black text-red-200 uppercase">¿Borrar?</span>
                             <button onClick={() => handleDelete(ex.id)} className="px-2.5 py-1 bg-red-600 text-white text-[9px] font-black rounded-lg uppercase">Sí</button>
                             <button onClick={() => setConfirmDeleteId(null)} className="px-2.5 py-1 bg-white/10 text-white/80 text-[9px] font-black rounded-lg uppercase">No</button>
                          </div>
                        ) : (
                          <>
                             <button 
                               onClick={() => setEditingEx(ex)} 
                               className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black text-[10px] font-black uppercase tracking-wider transition-all" 
                               title="Editar ejercicio y link de video"
                             >
                               ✎ Editar
                             </button>
                             <button 
                               onClick={() => setConfirmDeleteId(ex.id)} 
                               className="px-2.5 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white text-[10px] font-black uppercase transition-all" 
                               title="Eliminar ejercicio"
                             >
                               🗑
                             </button>
                          </>
                        )}
                     </div>
                  </div>
                  
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-white mb-1">{ex.name}</h3>
                  <p className="text-xs text-white/50 line-clamp-2">{ex.technique || 'Sin indicación técnica definida'}</p>
               </div>
               
               <div className="flex justify-between items-center pt-3 border-t border-white/5">
                  <span className={`text-[9px] font-bold truncate max-w-[65%] ${ex.videoUrl ? 'text-green-400/80' : 'text-white/25'}`}>
                    {ex.videoUrl ? '🎥 Video vinculado' : 'Sin link de video'}
                  </span>
                  <button 
                    onClick={() => ex.videoUrl ? setViewVideo(ex.videoUrl) : setEditingEx(ex)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all min-h-[40px] ${ex.videoUrl ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg' : 'bg-white/5 hover:bg-white/15 text-white/60'}`}
                  >
                    {ex.videoUrl ? '▶ Ver' : '+ Link'}
                  </button>
               </div>
            </div>
          ))}
          {filteredList.length === 0 && (
             <div className="col-span-full py-20 text-center opacity-40">
                <p className="text-xl font-black uppercase italic">No se encontraron ejercicios</p>
             </div>
          )}
       </div>

       {/* MODALS */}
       {viewVideo && <ExerciseVideoModal url={viewVideo} onClose={() => setViewVideo(null)} />}
       {editingEx !== null && <ExerciseEditModal exercise={editingEx === undefined ? undefined : editingEx} onClose={() => setEditingEx(null)} onSave={handleSave} />}
    </div>
  );
};