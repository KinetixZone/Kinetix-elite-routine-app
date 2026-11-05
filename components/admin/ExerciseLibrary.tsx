import React, { useState, useEffect, useMemo } from 'react';
import { Exercise } from '../../types/kinetix';
import { storageService } from '../../services/storageService';

import { getYoutubeEmbedUrl, getYoutubeVideoId } from '../../lib/youtube';

// --- SUB-COMPONENT: VIDEO MODAL ---
const ExerciseVideoModal: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
  if (!url) return null;
  const embedUrl = getYoutubeEmbedUrl(url, true);

  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
       <div className="relative w-full max-w-3xl flex flex-col gap-4 bg-[#0F0F11] border border-white/10 p-6 rounded-[36px] shadow-2xl">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Demostración Técnica YouTube</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 text-white flex items-center justify-center font-bold transition-colors">✕</button>
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

  const muscleGroups = ['Pecho', 'Espalda', 'Piernas', 'Bíceps', 'Tríceps', 'Hombro', 'Glúteo', 'Abdomen', 'Funcional', 'Halterofilia'];

  // Validación visual del link
  const validId = getYoutubeVideoId(formData.videoUrl);

  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6 animate-in slide-in-from-bottom-10 duration-300">
      <div className="bg-[#0F0F11] w-full max-w-lg rounded-t-[32px] md:rounded-[32px] border border-white/10 p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter">{exercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Nombre</label>
            <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Press Militar" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Grupo Muscular</label>
            <select className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white font-bold" value={formData.muscleGroup} onChange={e => setFormData({...formData, muscleGroup: e.target.value})}>
               {muscleGroups.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Link YouTube (Shorts/Normal)</label>
            <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white font-bold text-xs" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} placeholder="https://youtube.com/..." />
            {formData.videoUrl && (
                validId 
                ? <p className="text-[9px] text-green-500 mt-1">✓ ID detectado: {validId} (Thumbnail OK)</p>
                : <p className="text-[9px] text-red-500 mt-1">⚠ URL no reconocida</p>
            )}
          </div>
          <div>
             <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Técnica (Cue)</label>
             <textarea className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white font-bold text-xs h-20" value={formData.technique} onChange={e => setFormData({...formData, technique: e.target.value})} />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button onClick={onClose} className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-black uppercase tracking-widest">Cancelar</button>
          <button onClick={() => onSave(formData)} className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest shadow-lg">Guardar</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export const ExerciseLibrary: React.FC<{ isEmbedded?: boolean }> = ({ isEmbedded = false }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [viewVideo, setViewVideo] = useState<string | null>(null);
  const [editingEx, setEditingEx] = useState<Exercise | undefined | null>(null); // undefined = crear, null = cerrado
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setExercises(storageService.getExercises());
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(exercises.map(e => e.muscleGroup)));
    return ['Todos', ...cats.sort()];
  }, [exercises]);

  const filteredList = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'Todos' || ex.muscleGroup === filter;
      return matchesSearch && matchesFilter;
    });
  }, [exercises, filter, search]);

  const handleDelete = (id: string) => {
    storageService.deleteExercise(id);
    setExercises(storageService.getExercises());
    setConfirmDeleteId(null);
  };

  const handleSave = (ex: Exercise) => {
    // Al guardar, guardamos la URL original proporcionada
    storageService.addOrUpdateExercise(ex);
    setExercises(storageService.getExercises());
    setEditingEx(null);
  };

  const containerClasses = isEmbedded
    ? "space-y-6"
    : "pt-20 pb-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen";

  return (
    <div className={containerClasses}>
       {/* HEADER & ACTIONS (Ocultar encabezado redundante si está embebido en Coach Manager) */}
       {!isEmbedded && (
         <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
            <div>
               <p className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] mb-2">Base de Datos</p>
               <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">Exercise Library</h1>
            </div>
            <button 
              onClick={() => setEditingEx(undefined)} // Undefined triggers Create Mode
              className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,0,0.3)] transition-all active:scale-95"
            >
              + Nuevo Ejercicio
            </button>
         </div>
       )}
       {isEmbedded && (
         <div className="flex justify-between items-center mb-4">
            <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">{filteredList.length} Ejercicios en Catálogo</span>
            <button 
              onClick={() => setEditingEx(undefined)}
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all"
            >
              + Añadir Ejercicio
            </button>
         </div>
       )}

       {/* SEARCH & FILTER BAR */}
       <div className="sticky top-0 z-30 bg-[#050507]/95 backdrop-blur-xl py-4 -mx-4 px-4 md:mx-0 md:px-0 border-b border-white/5 mb-8 space-y-4">
          <div className="relative">
             <input 
               type="text" 
               placeholder="Buscar ejercicio por nombre..." 
               className="w-full bg-[#0F0F11] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder-white/20 focus:border-red-600 outline-none transition-colors"
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">🔍</span>
          </div>
          
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
             {categories.map(cat => (
               <button 
                 key={cat} 
                 onClick={() => setFilter(cat)}
                 className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${filter === cat ? 'bg-white text-black scale-105' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
               >
                 {cat}
               </button>
             ))}
          </div>
       </div>

       {/* GRID */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map(ex => (
            <div key={ex.id} className="bg-[#0F0F11] border border-white/5 rounded-[24px] p-5 hover:border-white/20 transition-colors group relative overflow-hidden">
               <div className="flex justify-between items-start mb-3">
                  <span className="px-2 py-1 bg-white/5 rounded-md text-[8px] font-black uppercase text-white/40 tracking-widest">{ex.muscleGroup}</span>
                  <div className="flex gap-2 items-center">
                     {confirmDeleteId === ex.id ? (
                       <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-600/50 px-2 py-1 rounded-xl">
                          <span className="text-[8px] font-black text-red-300 uppercase">¿Borrar?</span>
                          <button onClick={() => handleDelete(ex.id)} className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded uppercase">Sí</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-0.5 bg-white/10 text-white/70 text-[8px] font-black rounded uppercase">No</button>
                       </div>
                     ) : (
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingEx(ex)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white text-black flex items-center justify-center text-xs" title="Editar">✎</button>
                          <button onClick={() => setConfirmDeleteId(ex.id)} className="w-8 h-8 rounded-full bg-red-600/10 hover:bg-red-600 text-white flex items-center justify-center text-xs" title="Eliminar">✕</button>
                       </div>
                     )}
                  </div>
               </div>
               
               <h3 className="text-xl font-black uppercase italic tracking-tight mb-4 pr-10">{ex.name}</h3>
               
               <div className="flex justify-between items-end">
                  <p className="text-[10px] text-white/30 line-clamp-2 max-w-[70%]">{ex.technique || 'Sin técnica definida'}</p>
                  <button 
                    onClick={() => setViewVideo(ex.videoUrl)}
                    className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
                  >
                    ▶
                  </button>
               </div>
            </div>
          ))}
          {filteredList.length === 0 && (
             <div className="col-span-full py-20 text-center opacity-30">
                <p className="text-2xl font-black uppercase italic">No se encontraron resultados</p>
             </div>
          )}
       </div>

       {/* MODALS */}
       {viewVideo && <ExerciseVideoModal url={viewVideo} onClose={() => setViewVideo(null)} />}
       {editingEx !== null && <ExerciseEditModal exercise={editingEx === undefined ? undefined : editingEx} onClose={() => setEditingEx(null)} onSave={handleSave} />}
    </div>
  );
};