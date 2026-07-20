
import React, { useState, useMemo, useEffect } from 'react';
import { User, Workout, Goal, UserLevel, CalendarEvent } from '../../types/kinetix';
import { storageService } from '../../services/storageService';
import { calendarService } from '../../services/calendarService';
import { ExerciseBlockEditor } from './ExerciseBlockEditor';

// --- SUB-COMPONENT: ATHLETE FORM MODAL (ALTA/EDICIÓN) ---
const AthleteFormModal: React.FC<{ 
    athlete?: User | null; 
    onClose: () => void; 
    onSave: (user: User) => void 
}> = ({ athlete, onClose, onSave }) => {
    
    const [formData, setFormData] = useState<User>(athlete || {
        id: `ath-${Date.now()}`,
        name: '',
        email: '',
        role: 'client',
        goal: Goal.PERFORMANCE,
        level: UserLevel.BEGINNER,
        daysPerWeek: 4,
        equipment: ['Full Gym'],
        streak: 0,
        createdAt: new Date().toISOString(),
        isActive: true, 
        cycleEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        age: 0,
        weight: 0,
        injuries: '',
        medicalConditions: ''
    });

    const handleSubmit = () => {
        if (!formData.name.trim()) return alert("El Nombre es obligatorio.");
        if (!formData.email.trim() || !formData.email.includes('@')) return alert("El Email es obligatorio y debe ser válido.");
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95">
            <div className="bg-[#0F0F11] w-full max-w-2xl rounded-[40px] border border-white/10 p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                            {athlete ? 'Editar Perfil' : 'Nuevo Atleta'}
                        </h2>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                            {athlete ? `ID: ${athlete.id}` : 'Alta de usuario en Kinetix'}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-white transition-colors">✕</button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Nombre Completo *</label>
                            <input type="text" className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-red-600 transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Ana García" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Email (Login) *</label>
                            <input type="email" className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-red-600 transition-colors" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="ana@mail.com" />
                        </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl space-y-4 border border-white/5">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ficha Bio-Médica</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Edad</label>
                                <input type="number" className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold" value={formData.age || ''} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})} placeholder="Años" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Peso (KG)</label>
                                <input type="number" className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: parseInt(e.target.value)})} placeholder="KG" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Objetivo</label>
                            <select className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold" value={formData.goal} onChange={e => setFormData({...formData, goal: e.target.value as Goal})}>
                                {Object.values(Goal).map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Nivel</label>
                            <select className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value as UserLevel})}>
                                {Object.values(UserLevel).map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-yellow-900/10 p-4 rounded-2xl border border-yellow-500/20 flex items-center justify-between">
                         <div>
                            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Fin de Ciclo / Pago</p>
                            <p className="text-xs text-white/50">Fecha límite de acceso.</p>
                         </div>
                         <input 
                            type="date" 
                            className="bg-black border border-white/10 rounded-xl p-3 text-white font-bold focus:border-yellow-500 outline-none"
                            value={formData.cycleEndDate || ''}
                            onChange={e => setFormData({...formData, cycleEndDate: e.target.value})}
                         />
                    </div>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
                    <button onClick={onClose} className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                    <button onClick={handleSubmit} className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                        {athlete ? 'Guardar Cambios' : 'Confirmar Alta'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ... Resto de componentes internos (VenueScheduler, AthleteCalendar) se mantienen igual ...

const VenueSchedulerModal: React.FC<{ athlete: User; onClose: () => void; onApply: () => void }> = ({ athlete, onClose, onApply }) => {
    const [config, setConfig] = useState({ startDate: new Date().toISOString().split('T')[0], weeks: 4, days: [] as number[], mode: 'set_venue' as 'set_venue' | 'set_remote' });
    const toggleDay = (d: number) => setConfig(prev => ({ ...prev, days: prev.days.includes(d) ? prev.days.filter(x => x !== d) : [...prev.days, d] }));
    const handleExecute = () => {
        if (config.days.length === 0) return alert("Selecciona al menos un día.");
        const updatedCount = calendarService.batchScheduleVenue(athlete.id, config.startDate, config.weeks, config.days, config.mode === 'set_venue');
        if (updatedCount > 0) alert(`✅ Calendario Actualizado: ${updatedCount} días procesados.`);
        onApply();
    };
    return (
        <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
            <div className="bg-[#0F0F11] w-full max-w-md rounded-[40px] border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-6">Agenda de Clases</h2>
                <div className="space-y-6">
                    <div className="flex bg-white/5 p-1 rounded-xl">
                        <button onClick={() => setConfig({...config, mode: 'set_venue'})} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${config.mode === 'set_venue' ? 'bg-red-600 text-white shadow-lg' : 'text-white/30 hover:text-white'}`}>Clase</button>
                        <button onClick={() => setConfig({...config, mode: 'set_remote'})} className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${config.mode === 'set_remote' ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white'}`}>Remoto</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="date" className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs font-bold text-white" value={config.startDate} onChange={e => setConfig({...config, startDate: e.target.value})}/>
                        <select className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs font-bold text-white" value={config.weeks} onChange={e => setConfig({...config, weeks: parseInt(e.target.value)})}>
                            {[1, 2, 4, 8, 12].map(w => <option key={w} value={w}>{w} Semanas</option>)}
                        </select>
                    </div>
                    <div className="flex justify-between gap-2">
                        {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d, i) => (
                            <button key={i} onClick={() => toggleDay(i)} className={`w-10 h-10 rounded-full text-xs font-black transition-all ${config.days.includes(i) ? 'bg-red-600 text-white scale-110 shadow-lg' : 'bg-white/5 text-white/20'}`}>{d}</button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
                    <button onClick={onClose} className="flex-1 py-4 rounded-xl bg-white/5 text-[9px] font-black uppercase tracking-widest">Cancelar</button>
                    <button onClick={handleExecute} className="flex-1 py-4 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-widest shadow-lg">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

const AthleteCalendar: React.FC<{ athleteId: string; onDayClick: (dateStr: string, event?: CalendarEvent) => void; eventsTrigger: number; onOpenScheduler: () => void; }> = ({ athleteId, onDayClick, eventsTrigger, onOpenScheduler }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const events = useMemo(() => calendarService.getEvents().filter(e => e.athleteIds.includes(athleteId)), [athleteId, eventsTrigger, currentDate]); 
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); 
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) days.push(null); 
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const getDayEvents = (day: number) => {
    const dStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return events.filter(e => e.start.startsWith(dStr));
  };

  const currentMonthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}`;
  const monthEvents = useMemo(() => events.filter(e => e.start.startsWith(currentMonthPrefix)), [events, currentMonthPrefix]);

  return (
    <div className="bg-black/20 rounded-3xl p-6 border border-white/5 relative">
       <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
             <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="text-white/40">←</button>
             <h3 className="text-lg font-black uppercase italic tracking-widest">{currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h3>
             <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="text-white/40">→</button>
          </div>
          <button onClick={onOpenScheduler} className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/30 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">📍 Agenda Sede</button>
       </div>
       <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
             if (!day) return <div key={idx} className="aspect-square" />;
             const dEvents = getDayEvents(day);
             const hasWorkout = dEvents.length > 0;
             const isVenue = hasWorkout && dEvents[0].location === 'Kinetix Functional Zone';
             return (
               <div key={idx} onClick={() => onDayClick(`${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`, dEvents[0])} className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${hasWorkout ? isVenue ? 'bg-red-900/50 border-red-500 shadow-[0_0_10px_rgba(255,0,0,0.3)]' : 'bg-white/10 border-white/20' : 'bg-white/5 border-transparent'}`}>
                  <span className="text-xs font-bold">{day}</span>
                  {hasWorkout && (
                     <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  )}
               </div>
             );
          })}
       </div>

       {/* AGENDA MENSUAL DE RUTINAS */}
       <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
          <p className="text-[9px] font-black uppercase text-white/30 tracking-[0.3em] italic">Agenda Mensual de Rutinas</p>
          <div className="grid grid-cols-1 gap-3 max-h-72 overflow-y-auto custom-scrollbar">
             {monthEvents.sort((a, b) => a.start.localeCompare(b.start)).map(evt => {
                const datePart = evt.start.split('T')[0];
                const isVenue = evt.location === 'Kinetix Functional Zone';
                return (
                   <div 
                      key={evt.id} 
                      onClick={() => onDayClick(datePart, evt)} 
                      className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] cursor-pointer flex justify-between items-center ${isVenue ? 'bg-red-950/20 border-red-500/30 hover:border-red-500/50' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                   >
                      <div className="space-y-1">
                         <h4 className="text-xs font-black uppercase italic text-white tracking-wide">{evt.title}</h4>
                         <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded uppercase">{datePart}</span>
                            <span className="text-[8px] font-black text-white/30 uppercase">{evt.location ? 'Presencial (Sede)' : 'Remoto'}</span>
                         </div>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-red-500">Editar ⚡</span>
                   </div>
                );
             })}
             {monthEvents.length === 0 && (
                <div className="py-8 bg-white/[0.01] rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-lg opacity-30">📅</span>
                    <p className="text-[10px] font-black uppercase text-white/20 mt-2">Sin entrenamientos planificados este mes</p>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

// FIX: Define missing Props interface for AthleteCRM
interface Props {
  onSwitchUser: () => void;
}

export const AthleteCRM: React.FC<Props> = ({ onSwitchUser }) => {
  const [athletes, setAthletes] = useState<User[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<User | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'suspended'>('all');
  const [tab, setTab] = useState<'profile' | 'calendar'>('profile'); 
  const [editingInstance, setEditingInstance] = useState<Workout | null>(null);
  const [calendarTrigger, setCalendarTrigger] = useState(0); 
  const [showScheduler, setShowScheduler] = useState(false);
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [athleteToEdit, setAthleteToEdit] = useState<User | null>(null);
  const [assigningDate, setAssigningDate] = useState<string | null>(null);
  const [selectedTemplateIdToAssign, setSelectedTemplateIdToAssign] = useState<string>('');

  // Use an async wrapper inside useEffect to handle the async call to getTemplates
  useEffect(() => {
    setAthletes(storageService.getAthletes());
    // Fix: storageService.getTemplates() is async, must await it before setting state.
    const loadTemplates = async () => {
      const t = await storageService.getTemplates();
      setTemplates(t);
    };
    loadTemplates();
  }, []);

  const getCycleStatus = (athlete: User): 'active' | 'expiring' | 'suspended' => {
      if (athlete.isActive === false) return 'suspended';
      if (!athlete.cycleEndDate) return 'active'; 
      const diffDays = Math.ceil((new Date(athlete.cycleEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 7 ? 'expiring' : 'active';
  };

  const filteredAthletes = useMemo(() => athletes.filter(a => filter === 'all' || getCycleStatus(a) === filter), [athletes, filter]);

  const handleSendInvite = (athlete: User) => {
      alert(`📩 PROTOCOLO DE BIENVENIDA: Se ha simulado el envío de instrucciones de acceso al correo ${athlete.email}. \n\nMensaje: "Hola ${athlete.name.split(' ')[0]}, bienvenido a Kinetix. Tu acceso está listo. Entra con tu correo en la plataforma."`);
  };

  const handleUpdateUser = (updates: Partial<User>) => {
      if(!selectedAthlete) return;
      const updatedUser = { ...selectedAthlete, ...updates };
      setSelectedAthlete(updatedUser);
      const newAthletes = athletes.map(a => a.id === updatedUser.id ? updatedUser : a);
      setAthletes(newAthletes);
      storageService.saveAthletes(newAthletes);
  };

  return (
    <div className="h-full pt-20 pb-24 px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-6 animate-in fade-in duration-500">
      
      {/* LISTA DE ATLETAS */}
      <div className={`flex-1 flex flex-col gap-6 ${selectedAthlete ? 'hidden md:flex md:w-1/3' : 'w-full'}`}>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Athletes</h1>
          <button onClick={() => { setAthleteToEdit(null); setShowFormModal(true); }} className="w-12 h-12 rounded-full bg-red-600 text-white text-2xl font-black shadow-lg">+</button>
        </div>
        <div className="flex bg-white/5 rounded-full p-1 gap-1 overflow-x-auto no-scrollbar">
             {['all','active','expiring','suspended'].map(f => <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase whitespace-nowrap ${filter === f ? 'bg-white text-black' : 'text-white/40'}`}>{f}</button>)}
        </div>
        <div className="space-y-3 overflow-y-auto custom-scrollbar h-[calc(100vh-250px)]">
          {filteredAthletes.map(athlete => (
             <div key={athlete.id} onClick={() => setSelectedAthlete(athlete)} className={`p-5 rounded-[24px] border cursor-pointer transition-all hover:scale-[1.02] ${selectedAthlete?.id === athlete.id ? 'bg-white text-black border-white' : 'bg-[#0F0F11] border-white/5 hover:border-white/20'}`}>
                <h3 className="text-xl font-black uppercase italic tracking-tight mb-1">{athlete.name}</h3>
                <p className="text-[10px] opacity-40 font-bold uppercase">{athlete.email}</p>
             </div>
          ))}
        </div>
      </div>

      {/* COCKPIT DEL ATLETA */}
      {selectedAthlete && (
        <div className="flex-[2] bg-[#0F0F11] border border-white/5 rounded-[40px] p-6 md:p-10 flex flex-col h-[calc(100vh-140px)] overflow-hidden shadow-2xl relative animate-in slide-in-from-right-10">
           <button onClick={() => setSelectedAthlete(null)} className="md:hidden absolute top-6 right-6 text-white/40">✕</button>
           
           <div className="flex justify-between items-start mb-8 pb-8 border-b border-white/5">
              <div className="flex gap-6 items-center">
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-xl font-black">{selectedAthlete.name.charAt(0)}</div>
                <div>
                   <h2 className="text-4xl font-black uppercase italic tracking-tighter">{selectedAthlete.name}</h2>
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">{selectedAthlete.email}</p>
                </div>
              </div>
              <button onClick={() => handleSendInvite(selectedAthlete)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95">Enviar Acceso ✉️</button>
           </div>
           
           <div className="flex gap-6 mb-6">
              <button onClick={() => setTab('profile')} className={`pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 ${tab === 'profile' ? 'border-red-600 text-white' : 'border-transparent text-white/30'}`}>Ficha & Control</button>
              <button onClick={() => setTab('calendar')} className={`pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 ${tab === 'calendar' ? 'border-red-600 text-white' : 'border-transparent text-white/30'}`}>Calendario / Edición</button>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar">
              {tab === 'profile' && (
                 <div className="space-y-6">
                    <div className="bg-[#1A1A1D] rounded-3xl p-6 border border-white/5 flex items-center justify-between">
                        <div><h3 className="text-lg font-black uppercase italic">Acceso App</h3><p className="text-[10px] opacity-40 uppercase">Interruptor Maestro</p></div>
                        <div onClick={() => handleUpdateUser({ isActive: !selectedAthlete.isActive })} className={`w-14 h-8 rounded-full p-1 cursor-pointer ${selectedAthlete.isActive ? 'bg-green-600' : 'bg-red-600'}`}><div className={`w-6 h-6 bg-white rounded-full transition-all ${selectedAthlete.isActive ? 'translate-x-6' : ''}`} /></div>
                    </div>
                    <div className="bg-black/20 rounded-3xl p-6 border border-white/5 space-y-4">
                        <label className="text-[9px] font-black opacity-30 uppercase tracking-widest">Fin de Membresía</label>
                        <input type="date" className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-bold" value={selectedAthlete.cycleEndDate || ''} onChange={e => handleUpdateUser({ cycleEndDate: e.target.value })} />
                    </div>
                    <button onClick={() => { setAthleteToEdit(selectedAthlete); setShowFormModal(true); }} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Editar Ficha Médica</button>
                 </div>
              )}
              {tab === 'calendar' && <AthleteCalendar athleteId={selectedAthlete.id} onDayClick={(dateStr, event) => {
                  if (event) {
                      const workout = storageService.getWorkoutById(event.workoutTemplateId!);
                      if (workout) {
                          setEditingInstance({ ...workout, id: `inst-${Date.now()}`, isTemplate: false, scheduledDate: dateStr, assignedTo: selectedAthlete.id, location: event.location });
                      }
                  } else {
                      setAssigningDate(dateStr);
                      setSelectedTemplateIdToAssign('');
                  }
              }} eventsTrigger={calendarTrigger} onOpenScheduler={() => setShowScheduler(true)} />}
           </div>
        </div>
      )}

      {/* MODALS */}
      {showFormModal && <AthleteFormModal athlete={athleteToEdit} onClose={() => setShowFormModal(false)} onSave={(u) => {
          let newList = [...athletes];
          if (athleteToEdit) newList = newList.map(a => a.id === u.id ? u : a);
          else newList.push(u);
          setAthletes(newList);
          storageService.saveAthletes(newList);
          setShowFormModal(false);
          if (athleteToEdit) setSelectedAthlete(u);
      }} />}

      {editingInstance && (
          <div className="fixed inset-0 z-[2000] bg-[#0F0F11] flex flex-col p-6 animate-in slide-in-from-bottom-10">
              <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-2xl font-black uppercase italic text-red-600">{editingInstance.name} <span className="text-white/20 text-xs not-italic">({editingInstance.scheduledDate})</span></h3>
                  <div className="flex gap-3">
                      <button onClick={() => {
                          if (confirm("¿Seguro que deseas eliminar esta rutina de este día?")) {
                              calendarService.clearDaySessions(selectedAthlete!.id, editingInstance.scheduledDate!);
                              setCalendarTrigger(prev => prev + 1);
                              setEditingInstance(null);
                          }
                      }} className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-[9px] uppercase font-black transition-colors">Eliminar de este Día 🗑</button>
                      <button onClick={() => setEditingInstance(null)} className="px-6 py-3 bg-white/5 rounded-xl text-[9px] uppercase font-black">Cerrar</button>
                      <button onClick={async () => {
                          await storageService.saveUserSpecificWorkout(editingInstance);
                          calendarService.saveEvent({ id: `evt-${editingInstance.id}`, type: 'workout', title: editingInstance.name, start: `${editingInstance.scheduledDate}T12:00:00`, end: `${editingInstance.scheduledDate}T13:00:00`, allDay: true, coachId: 'jorge', athleteIds: [selectedAthlete!.id], workoutTemplateId: editingInstance.id, location: editingInstance.location });
                          setCalendarTrigger(prev => prev + 1);
                          setEditingInstance(null);
                      }} className="px-6 py-3 bg-green-600 rounded-xl text-[9px] uppercase font-black shadow-lg">Guardar Cambios</button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-20">
                  <div onClick={() => setEditingInstance({...editingInstance, location: editingInstance.location ? undefined : 'Kinetix Functional Zone'})} className={`p-5 rounded-3xl border flex items-center justify-between cursor-pointer ${editingInstance.location ? 'bg-red-600/10 border-red-600' : 'bg-white/5 border-white/5'}`}>
                      <div><p className="text-xs font-black uppercase">Modo: {editingInstance.location ? 'Presencial (Sede)' : 'Remoto'}</p></div>
                      <div className={`w-12 h-6 rounded-full transition-colors ${editingInstance.location ? 'bg-red-600' : 'bg-white/10'}`} />
                  </div>
                  {editingInstance.exercises.map((ex, idx) => (
                      <div key={idx} className="relative group">
                          <ExerciseBlockEditor exercise={ex} onUpdate={(u) => {
                              const newExs = [...editingInstance.exercises];
                              newExs[idx] = u;
                              setEditingInstance({ ...editingInstance, exercises: newExs });
                          }} />
                          <div className="absolute top-4 right-4 z-10">
                              <button 
                                  onClick={() => {
                                      if (confirm(`¿Seguro que deseas eliminar el ejercicio "${ex.name}"?`)) {
                                          const newExs = editingInstance.exercises.filter((_, i) => i !== idx);
                                          setEditingInstance({ ...editingInstance, exercises: newExs });
                                      }
                                  }} 
                                  className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                  Eliminar Ejercicio 🗑
                              </button>
                          </div>
                      </div>
                  ))}

                  <button 
                      onClick={() => {
                          const newExs = [...editingInstance.exercises, {
                              exerciseId: 'leg-1',
                              name: 'Sentadilla (Squat)',
                              targetSets: 4,
                              targetReps: '10',
                              targetLoad: '0',
                              targetRest: 90,
                              videoUrl: 'https://www.youtube.com/embed/oSx178WQB70',
                              method: 'standard' as any
                          }];
                          setEditingInstance({ ...editingInstance, exercises: newExs });
                      }}
                      className="w-full py-6 bg-white/5 border border-dashed border-white/10 hover:border-white/30 rounded-[32px] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all text-white/50 hover:text-white flex items-center justify-center gap-3"
                  >
                      Agregar Ejercicio ➕
                  </button>
              </div>
          </div>
      )}
      
       {showScheduler && selectedAthlete && <VenueSchedulerModal athlete={selectedAthlete} onClose={() => setShowScheduler(false)} onApply={() => { setShowScheduler(false); setCalendarTrigger(prev => prev + 1); }} />}

       {assigningDate && (
          <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95">
              <div className="bg-[#0F0F11] w-full max-w-md rounded-[40px] border border-white/10 p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">Asignar Rutina</h2>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-6">
                      DÍA: {assigningDate}
                  </p>
                  
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Plantilla Master</label>
                          <select 
                              className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-red-600 transition-colors"
                              value={selectedTemplateIdToAssign}
                              onChange={(e) => setSelectedTemplateIdToAssign(e.target.value)}
                          >
                              <option value="">-- SELECCIONAR PLANTILLA --</option>
                              {templates.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                          </select>
                      </div>

                      <div className="flex gap-4 pt-4 border-t border-white/5">
                          <button 
                              onClick={() => setAssigningDate(null)} 
                              className="flex-1 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={async () => {
                                  if (!selectedTemplateIdToAssign) return alert("Selecciona una plantilla");
                                  const tpl = templates.find(t => t.id === selectedTemplateIdToAssign);
                                  if (!tpl) return;
                                  
                                  const instance: Workout = JSON.parse(JSON.stringify(tpl));
                                  const newId = `direct-${selectedAthlete!.id}-${Date.now()}`;
                                  instance.id = newId;
                                  instance.isTemplate = false;
                                  instance.assignedTo = selectedAthlete!.id;
                                  instance.scheduledDate = assigningDate;
                                  
                                  await storageService.saveUserSpecificWorkout(instance);
                                  calendarService.saveEvent({ 
                                      id: `evt-${newId}`, 
                                      type: 'workout', 
                                      title: instance.name, 
                                      start: `${assigningDate}T12:00:00`, 
                                      end: `${assigningDate}T13:00:00`, 
                                      allDay: true, 
                                      coachId: 'system', 
                                      athleteIds: [selectedAthlete!.id], 
                                      workoutTemplateId: newId 
                                  });
                                  
                                  setCalendarTrigger(prev => prev + 1);
                                  setAssigningDate(null);
                              }} 
                              className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                              Asignar
                          </button>
                      </div>
                  </div>
              </div>
          </div>
       )}
    </div>
  );
};
