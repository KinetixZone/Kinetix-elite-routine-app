import React, { useState, useEffect, useMemo } from 'react';
import { Exercise } from '../../types/kinetix';
import { storageService } from '../../services/storageService';

// --- HELPER: VIDEO CLEANER (REGEX ROBUSTA) ---
// Extrae el ID independientemente si es /shorts/, /watch?v=, /embed/ o youtu.be/
const getYoutubeId = (url: string) => {
  if (!url) return null;
  const cleanUrl = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = cleanUrl.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// --- SUB-COMPONENT: VIDEO MODAL ---
const ExerciseVideoModal: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
  if (!url) return null;
  const videoId = getYoutubeId(url);

  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
       <div className="relative w-full max-w-3xl flex flex-col gap-4">
          <div className="relative aspect-video bg-black rounded-3xl border border-white/10 shadow-2xl overflow-hidden group">
             <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-red-600/80 hover:bg-red-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors">✕</button>
             
             {videoId ? (
                 <>
                    <img 
                        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
                        className="w-full h-full object-cover opacity-50"
                        alt="Video Preview"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <a 
                           href={`https://www.youtube.com/watch?v=${videoId}`} 
                           target="_blank" 
                           rel="noreferrer"
                           className="flex flex-col items-center gap-4 group/btn"
                        >
                             <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-white text-4xl pl-1 shadow-[0_0_50px_rgba(220,38,38,0.5)] group-hover/btn:scale-110 transition-transform">
                                ▶
                             </div>
                             <div className="bg-black/80 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Ver en YouTube</span>
                             </div>
                        </a>
                    </div>
                 </>
             ) : (
                 <div className="w-full h-full flex items-center justify-center text-white/50 text-xs uppercase font-black">
                     Error: ID de video no válido
                 </div>
             )}
          </div>
          
          <p className="text-center text-[9px] text-white/30 uppercase tracking-widest">
              El video se abrirá en una nueva pestaña
          </p>
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
  const validId = getYoutubeId(formData.videoUrl);

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
export const ExerciseLibrary: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [viewVideo, setViewVideo] = useState<string | null>(null);
  const [editingEx, setEditingEx] = useState<Exercise | undefined | null>(null); // undefined = crear, null = cerrado

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
    if (window.confirm('¿Eliminar ejercicio permanentemente?')) {
      storageService.deleteExercise(id);
      setExercises(storageService.getExercises());
    }
  };

  const handleSave = (ex: Exercise) => {
    // Al guardar, no transformamos la URL, guardamos la original
    // La extracción se hace en tiempo de renderizado con getYoutubeId
    storageService.addOrUpdateExercise(ex);
    setExercises(storageService.getExercises());
    setEditingEx(null);
  };

  return (
    <div className="pt-20 pb-32 px-4 md:px-8 max-w-7xl mx-auto min-h-screen">
       {/* HEADER & ACTIONS */}
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
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => setEditingEx(ex)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white text-black flex items-center justify-center text-xs">✎</button>
                     <button onClick={() => handleDelete(ex.id)} className="w-8 h-8 rounded-full bg-red-600/10 hover:bg-red-600 text-white flex items-center justify-center text-xs">✕</button>
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