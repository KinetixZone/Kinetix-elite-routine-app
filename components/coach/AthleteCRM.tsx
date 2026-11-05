import React, { useState, useMemo, useEffect } from 'react';
import { User, Workout, Goal, UserLevel, CalendarEvent, SessionFeedback, WorkoutExercise } from '../../types/kinetix';
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
        password: 'kinetix.atleta',
        role: 'client',
        goal: Goal.PERFORMANCE,
        level: UserLevel.BEGINNER,
        daysPerWeek: 4,
        equipment: ['Full Gym'],
        streak: 0,
        createdAt: new Date().toISOString(),
        isActive: true, 
        cycleEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        age: 25,
        weight: 70,
        injuries: '',
        medicalConditions: ''
    });

    const generateRandomPassword = () => {
        const rand = Math.floor(1000 + Math.random() * 9000);
        setFormData({ ...formData, password: `kinetix.${rand}` });
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) return alert("El Nombre es obligatorio.");
        if (!formData.email.trim() || !formData.email.includes('@')) return alert("El Email es obligatorio y debe ser válido.");
        if (!formData.password?.trim()) return alert("Debes asignar una Clave de Acceso para el atleta.");
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95">
            <div className="bg-[#0F0F11] w-full max-w-2xl rounded-[40px] border border-white/10 p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                            {athlete ? 'Editar Perfil & Acceso' : 'Nuevo Atleta'}
                        </h2>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                            {athlete ? `ID: ${athlete.id}` : 'Alta de usuario y asignación de credenciales'}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-white transition-colors">✕</button>
                </div>

                <div className="space-y-6">
                    {/* CREDENCIALES DE ACCESO */}
                    <div className="bg-red-950/20 p-5 rounded-3xl border border-red-600/30 space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                                🔑 Credenciales de Acceso (App Atleta)
                            </p>
                            <span className="text-[8px] text-white/30 uppercase">Login Directo</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Email (Login) *</label>
                                <input 
                                    type="email" 
                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-red-600 transition-colors" 
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                    placeholder="atleta@mail.com" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[9px] font-black text-white/40 uppercase tracking-widest">Clave Asignada *</label>
                                    <button 
                                        type="button" 
                                        onClick={generateRandomPassword}
                                        className="text-[8px] font-black text-red-400 hover:text-white uppercase tracking-wider"
                                    >
                                        ⚡ Generar
                                    </button>
                                </div>
                                <input 
                                    type="text" 
                                    className="w-full bg-black border border-red-500/40 rounded-xl p-3 text-red-400 font-mono font-bold outline-none focus:border-red-500 transition-colors" 
                                    value={formData.password || ''} 
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                    placeholder="kinetix.atleta" 
                                />
                            </div>
                        </div>
                        <p className="text-[8px] text-white/40 italic">
                            * El atleta iniciará sesión introduciendo este correo y esta clave que tú le proporciones.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Nombre Completo *</label>
                            <input type="text" className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-red-600 transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Ana García" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Fin de Ciclo / Membresía</label>
                            <input 
                                type="date" 
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold focus:border-red-500 outline-none"
                                value={formData.cycleEndDate || ''}
                                onChange={e => setFormData({...formData, cycleEndDate: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl space-y-4 border border-white/5">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Ficha Bio-Médica & Rendimiento</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Edad</label>
                                <input type="number" className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold" value={formData.age || ''} onChange={e => setFormData({...formData, age: parseInt(e.target.value) || 0})} placeholder="Años" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Peso (KG)</label>
                                <input type="number" className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: parseInt(e.target.value) || 0})} placeholder="KG" />
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
               <div key={idx} onClick={() => onDayClick(`${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`, dEvents[0])} className={`relative aspect-square rounded-xl border p-1 flex flex-col items-center justify-between cursor-pointer transition-all ${hasWorkout ? isVenue ? 'bg-red-950/80 border-red-500 shadow-[0_0_10px_rgba(255,0,0,0.3)] hover:bg-red-900/80' : 'bg-white/10 border-white/20 hover:bg-white/15' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                  <span className="text-xs font-bold self-start pl-1">{day}</span>
                  {hasWorkout ? (
                     <div className="w-full flex flex-col items-center pb-1">
                        <p className="text-[7px] leading-tight font-black uppercase text-red-500 text-center truncate max-w-full px-0.5" title={dEvents[0].title}>
                           {dEvents[0].title}
                        </p>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mt-1" />
                     </div>
                  ) : (
                     <div className="h-4" />
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

interface Props {
  onSwitchUser: () => void;
}

export const AthleteCRM: React.FC<Props> = ({ onSwitchUser }) => {
  const [athletes, setAthletes] = useState<User[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<User | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'expiring' | 'suspended'>('all');
  const [tab, setTab] = useState<'profile' | 'calendar' | 'history'>('profile'); 
  const [editingInstance, setEditingInstance] = useState<Workout | null>(null);
  const [clickedEvent, setClickedEvent] = useState<CalendarEvent | null>(null);
  const [calendarTrigger, setCalendarTrigger] = useState(0); 
  const [copiedKey, setCopiedKey] = useState(false);
  
  // Asignación & Propagación
  const [assigningDate, setAssigningDate] = useState<string | null>(null);
  const [selectedTemplateIdToAssign, setSelectedTemplateIdToAssign] = useState<string>('');
  const [assignWeeks, setAssignWeeks] = useState<number>(1);
  const [assignProgWeight, setAssignProgWeight] = useState<number>(0);
  const [assignImmediateEdit, setAssignImmediateEdit] = useState<boolean>(true);

  // Propagación de sesión en edición
  const [showPropagateModal, setShowPropagateModal] = useState(false);
  const [propagateWeeks, setPropagateWeeks] = useState(4);
  const [propagateWeightInc, setPropagateWeightInc] = useState(2.5);

  const [showScheduler, setShowScheduler] = useState(false);
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [athleteToEdit, setAthleteToEdit] = useState<User | null>(null);

  useEffect(() => {
    const list = storageService.getAthletes();
    setAthletes(list);
    if (list.length > 0 && !selectedAthlete) {
      setSelectedAthlete(list[0]);
    }
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const all = await storageService.getTemplates();
    setTemplates(all.filter(t => t.isTemplate !== false));
  };

  const completedSessions = useMemo(() => {
    if (!selectedAthlete) return [];
    const logs = storageService.getAllLogs().filter(log => log.athleteId === selectedAthlete.id);
    const sessionsMap: { [key: string]: { 
        date: string; 
        workoutName: string; 
        workoutId: string; 
        feedback?: SessionFeedback; 
        logs: typeof logs 
    } } = {};

    logs.forEach(log => {
        const dateKey = log.timestamp.split('T')[0];
        const workoutKey = log.workoutId || 'legacy';
        const groupKey = `${dateKey}-${workoutKey}`;

        if (!sessionsMap[groupKey]) {
            sessionsMap[groupKey] = {
                date: dateKey,
                workoutName: log.workoutName || 'Entrenamiento Kinetix',
                workoutId: log.workoutId || 'legacy',
                feedback: log.feedback,
                logs: []
            };
        }
        sessionsMap[groupKey].logs.push(log);
        if (log.feedback && !sessionsMap[groupKey].feedback) {
            sessionsMap[groupKey].feedback = log.feedback;
        }
    });

    return Object.values(sessionsMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedAthlete, calendarTrigger]);

  const filteredAthletes = useMemo(() => {
      return athletes.filter(a => {
          if (filter === 'all') return true;
          if (filter === 'active') return a.isActive;
          if (filter === 'suspended') return !a.isActive;
          if (filter === 'expiring') {
              if (!a.cycleEndDate) return false;
              const diff = (new Date(a.cycleEndDate).getTime() - Date.now()) / (1000 * 3600 * 24);
              return diff <= 7 && diff >= 0;
          }
          return true;
      });
  }, [athletes, filter]);

  const handleUpdateUser = (updates: Partial<User>) => {
      if (!selectedAthlete) return;
      const updated = { ...selectedAthlete, ...updates };
      setSelectedAthlete(updated);
      const newList = athletes.map(a => a.id === updated.id ? updated : a);
      setAthletes(newList);
      storageService.saveAthletes(newList);
  };

  const handleCopyAccess = () => {
    if (!selectedAthlete) return;
    const text = `KINETIX APP LOGIN:\nEmail: ${selectedAthlete.email}\nClave: ${selectedAthlete.password || 'kinetix.atleta'}`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handlePropagateCurrentSession = async () => {
    if (!editingInstance || !selectedAthlete || !editingInstance.scheduledDate) return;
    const baseDate = new Date(`${editingInstance.scheduledDate}T12:00:00`);
    
    for (let w = 1; w <= propagateWeeks; w++) {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + (w * 7));
        const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth()+1).padStart(2,'0')}-${String(nextDate.getDate()).padStart(2,'0')}`;

        const clone: Workout = JSON.parse(JSON.stringify(editingInstance));
        const newId = `inst-${selectedAthlete.id}-${dateStr}-${Date.now()}`;
        clone.id = newId;
        clone.isTemplate = false;
        clone.assignedTo = selectedAthlete.id;
        clone.scheduledDate = dateStr;

        if (propagateWeightInc > 0) {
            clone.exercises = clone.exercises.map(ex => {
                if (ex.targetLoad) {
                    ex.targetLoad = ex.targetLoad.split(',').map(l => {
                        const parsed = parseFloat(l.trim());
                        return isNaN(parsed) ? l : (parsed + (propagateWeightInc * w)).toString();
                    }).join(', ');
                }
                return ex;
            });
        }

        await storageService.saveUserSpecificWorkout(clone);
        calendarService.saveEvent({
            id: `evt-${newId}`,
            type: 'workout',
            title: clone.name,
            start: `${dateStr}T12:00:00`,
            end: `${dateStr}T13:00:00`,
            allDay: true,
            coachId: 'jorge',
            athleteIds: [selectedAthlete.id],
            workoutTemplateId: newId,
            location: clone.location
        });
    }

    setCalendarTrigger(prev => prev + 1);
    setShowPropagateModal(false);
    alert(`✅ Rutina propagada a las próximas ${propagateWeeks} semanas con éxito.`);
  };

  const handleSaveAsMasterTemplate = async () => {
    if (!editingInstance) return;
    const name = prompt("Nombre de la nueva plantilla maestra:", editingInstance.name);
    if (!name) return;

    const master: Workout = {
      ...editingInstance,
      id: `tpl-${Date.now()}`,
      name: name,
      isTemplate: true,
      assignedTo: undefined,
      scheduledDate: undefined
    };

    await storageService.saveTemplate(master);
    await loadTemplates();
    alert(`✅ Plantilla "${name}" guardada en la biblioteca de rutinas.`);
  };

  const allExercises = useMemo(() => storageService.getExercises(), []);

  return (
    <div className="pt-20 pb-32 px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      {/* SIDEBAR DE ATLETAS */}
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Atletas</h1>
          <button onClick={() => { setAthleteToEdit(null); setShowFormModal(true); }} className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white text-2xl font-black shadow-lg transition-all" title="Crear Nuevo Atleta">+</button>
        </div>
        <div className="flex bg-white/5 rounded-full p-1 gap-1 overflow-x-auto no-scrollbar">
             {['all','active','expiring','suspended'].map(f => <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase whitespace-nowrap ${filter === f ? 'bg-white text-black' : 'text-white/40'}`}>{f}</button>)}
        </div>
        <div className="space-y-3 overflow-y-auto custom-scrollbar h-[calc(100vh-250px)]">
          {filteredAthletes.map(athlete => (
             <div key={athlete.id} onClick={() => setSelectedAthlete(athlete)} className={`p-5 rounded-[24px] border cursor-pointer transition-all hover:scale-[1.01] ${selectedAthlete?.id === athlete.id ? 'bg-white text-black border-white shadow-xl' : 'bg-[#0F0F11] border-white/5 hover:border-white/20'}`}>
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-black uppercase italic tracking-tight mb-1">{athlete.name}</h3>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${athlete.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {athlete.isActive ? 'Activo' : 'Pausado'}
                    </span>
                </div>
                <p className="text-[10px] opacity-50 font-bold uppercase">{athlete.email}</p>
                <p className="text-[8px] font-mono mt-1 text-red-600/70">Clave: {athlete.password || 'kinetix.atleta'}</p>
             </div>
          ))}
          {filteredAthletes.length === 0 && (
             <p className="text-center text-xs font-black uppercase text-white/20 py-8">No hay atletas con este filtro</p>
          )}
        </div>
      </div>

      {/* COCKPIT DEL ATLETA */}
      {selectedAthlete && (
        <div className="flex-[2] bg-[#0F0F11] border border-white/5 rounded-[40px] p-6 md:p-10 flex flex-col h-[calc(100vh-140px)] overflow-hidden shadow-2xl relative animate-in slide-in-from-right-10">
           <button onClick={() => setSelectedAthlete(null)} className="md:hidden absolute top-6 right-6 text-white/40">✕</button>
           
           {/* HEADER COCKPIT */}
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-white/5">
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-3xl bg-red-600 flex items-center justify-center text-2xl font-black shadow-lg shadow-red-600/20">
                    {selectedAthlete.name.charAt(0)}
                </div>
                <div>
                   <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">{selectedAthlete.name}</h2>
                   <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{selectedAthlete.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCopyAccess} 
                  className="bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all"
                >
                  {copiedKey ? '✓ ¡Credenciales Copiadas!' : '📋 Copiar Acceso Atleta'}
                </button>
                <button 
                  onClick={() => { setAthleteToEdit(selectedAthlete); setShowFormModal(true); }}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all"
                >
                  ✎ Editar
                </button>
              </div>
           </div>
           
           <div className="flex gap-6 mb-6">
              <button onClick={() => setTab('profile')} className={`pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${tab === 'profile' ? 'border-red-600 text-white' : 'border-transparent text-white/30'}`}>Ficha & Control</button>
              <button onClick={() => setTab('calendar')} className={`pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${tab === 'calendar' ? 'border-red-600 text-white' : 'border-transparent text-white/30'}`}>Calendario / Edición</button>
              <button onClick={() => setTab('history')} className={`pb-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${tab === 'history' ? 'border-red-600 text-white' : 'border-transparent text-white/30'}`}>Historial & RPE 📊</button>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar">
              {tab === 'profile' && (
                 <div className="space-y-6">
                    {/* CREDENCIALES DE ACCESO DEL ATLETA */}
                    <div className="bg-[#151518] rounded-3xl p-6 border border-red-500/20 space-y-3">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-black uppercase italic text-red-500">Credenciales de Login del Atleta</h3>
                                <p className="text-[9px] text-white/40 uppercase">El atleta entra con estos datos a su app</p>
                            </div>
                            <span className="text-[8px] bg-red-600/20 text-red-400 font-mono px-2.5 py-1 rounded-full uppercase font-black">
                                {selectedAthlete.role}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="bg-black/60 p-3 rounded-2xl border border-white/5 space-y-1">
                                <span className="text-[8px] font-black uppercase text-white/30">Email de Entrada:</span>
                                <p className="text-xs font-mono font-bold text-white select-all">{selectedAthlete.email}</p>
                            </div>
                            <div className="bg-black/60 p-3 rounded-2xl border border-white/5 space-y-1">
                                <span className="text-[8px] font-black uppercase text-white/30">Clave Asignada:</span>
                                <p className="text-xs font-mono font-bold text-red-400 select-all">{selectedAthlete.password || 'kinetix.atleta'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1A1A1D] rounded-3xl p-6 border border-white/5 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black uppercase italic">Estado de Membresía</h3>
                            <p className="text-[10px] opacity-40 uppercase">Habilitar o pausar acceso a la plataforma</p>
                        </div>
                        <div onClick={() => handleUpdateUser({ isActive: !selectedAthlete.isActive })} className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${selectedAthlete.isActive ? 'bg-green-600' : 'bg-red-600'}`}>
                            <div className={`w-6 h-6 bg-white rounded-full transition-all ${selectedAthlete.isActive ? 'translate-x-6' : ''}`} />
                        </div>
                    </div>

                    <div className="bg-black/20 rounded-3xl p-6 border border-white/5 space-y-4">
                        <label className="text-[9px] font-black opacity-30 uppercase tracking-widest">Fin de Membresía</label>
                        <input type="date" className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-bold" value={selectedAthlete.cycleEndDate || ''} onChange={e => handleUpdateUser({ cycleEndDate: e.target.value })} />
                    </div>

                    <div className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-blue-400">Datos Bio-Médicos</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                                <span className="text-[8px] uppercase font-black text-white/30 block">Edad:</span>
                                <span className="font-bold text-white">{selectedAthlete.age || 'No reg.'} años</span>
                            </div>
                            <div>
                                <span className="text-[8px] uppercase font-black text-white/30 block">Peso:</span>
                                <span className="font-bold text-white">{selectedAthlete.weight || 'No reg.'} kg</span>
                            </div>
                            <div>
                                <span className="text-[8px] uppercase font-black text-white/30 block">Nivel:</span>
                                <span className="font-bold text-white">{selectedAthlete.level}</span>
                            </div>
                            <div>
                                <span className="text-[8px] uppercase font-black text-white/30 block">Objetivo:</span>
                                <span className="font-bold text-white">{selectedAthlete.goal}</span>
                            </div>
                        </div>
                    </div>
                 </div>
              )}

              {tab === 'calendar' && (
                <AthleteCalendar 
                  athleteId={selectedAthlete.id} 
                  onDayClick={(dateStr, event) => {
                    if (event) {
                        setClickedEvent(event);
                        const workout = storageService.getWorkoutById(event.workoutTemplateId!) || {
                            id: event.workoutTemplateId || `inst-${selectedAthlete.id}-${Date.now()}`,
                            name: event.title || 'Entrenamiento Kinetix',
                            day: 1,
                            exercises: [],
                            isTemplate: false,
                            scheduledDate: dateStr,
                            assignedTo: selectedAthlete.id,
                            location: event.location
                        };
                        setEditingInstance(workout);
                    } else {
                        setClickedEvent(null);
                        setAssigningDate(dateStr);
                        setSelectedTemplateIdToAssign(templates[0]?.id || '');
                    }
                  }} 
                  eventsTrigger={calendarTrigger} 
                  onOpenScheduler={() => setShowScheduler(true)} 
                />
              )}
              
              {tab === 'history' && (
                 <div className="space-y-6">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] italic">Bitácora de Rendimiento</p>
                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">{completedSessions.length} Sesiones Registradas</span>
                    </div>

                    <div className="space-y-4">
                        {completedSessions.map((session, idx) => {
                            const rpe = session.feedback?.rpe || 0;
                            const fatigue = session.feedback?.fatigue || 0;
                            const notes = session.feedback?.notes;
                            
                            let rpeColor = 'text-green-500 bg-green-500/10 border-green-500/20';
                            if (rpe >= 8) rpeColor = 'text-red-500 bg-red-500/10 border-red-500/20';
                            else if (rpe >= 6) rpeColor = 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';

                            let fatigueColor = 'text-green-400 bg-green-400/5';
                            if (fatigue >= 4) fatigueColor = 'text-red-400 bg-red-400/5';
                            else if (fatigue >= 3) fatigueColor = 'text-yellow-400 bg-yellow-400/5';

                            return (
                                <div key={idx} className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4 hover:border-white/10 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-sm font-black uppercase italic tracking-wide text-white">{session.workoutName}</h4>
                                            <p className="text-[8px] font-mono uppercase text-white/40 mt-1">{session.date} // {session.logs[0]?.executionMode || 'Remoto'}</p>
                                        </div>
                                        {rpe > 0 && (
                                            <div className={`px-3 py-1 rounded-full border text-[8px] font-black tracking-widest uppercase ${rpeColor}`}>
                                                RPE: @{rpe}
                                            </div>
                                        )}
                                    </div>

                                    {(rpe > 0 || fatigue > 0 || notes) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 text-xs">
                                            {fatigue > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-black uppercase text-white/30">Fatiga Post-Op:</span>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${fatigueColor}`}>{fatigue} / 5</span>
                                                </div>
                                            )}
                                            {notes && (
                                                <div className="col-span-2 space-y-1">
                                                    <span className="text-[8px] font-black uppercase text-white/30 block">Notas del Atleta:</span>
                                                    <p className="text-[10px] text-white/70 italic font-medium">"{notes}"</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Ejecución del Entrenamiento:</p>
                                        <div className="grid grid-cols-1 gap-2 pl-2 border-l border-white/5">
                                            {Array.from(new Set(session.logs.map(l => l.exerciseId))).map(exId => {
                                                const exName = storageService.getExercises().find(ex => ex.id === exId)?.name || exId;
                                                const exerciseLogs = session.logs.filter(l => l.exerciseId === exId).sort((a, b) => a.setIndex - b.setIndex);
                                                return (
                                                    <div key={exId} className="text-xs">
                                                        <span className="font-black text-white/80 uppercase italic text-[10px] block mb-1">↳ {exName}</span>
                                                        <div className="flex flex-wrap gap-2">
                                                            {exerciseLogs.map((l, sIdx) => (
                                                                <div key={sIdx} className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-[9px] font-mono text-white/50">
                                                                    S{sIdx+1}: <span className="font-bold text-white">{l.weight}kg</span> × <span className="font-bold text-white">{l.reps}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {completedSessions.length === 0 && (
                            <div className="py-12 bg-white/[0.01] rounded-[32px] border border-dashed border-white/5 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl opacity-20">📊</span>
                                <p className="text-[10px] font-black uppercase text-white/20 mt-3 tracking-widest">Aún no hay registros para este atleta</p>
                                <p className="text-[8px] text-white/10 uppercase mt-1">El historial se llenará cuando complete entrenamientos en la app.</p>
                            </div>
                        )}
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* MODAL: FORMULARIO ALTA/EDICIÓN ATLETA */}
      {showFormModal && (
        <AthleteFormModal 
          athlete={athleteToEdit} 
          onClose={() => setShowFormModal(false)} 
          onSave={(u) => {
            let newList = [...athletes];
            if (athleteToEdit) newList = newList.map(a => a.id === u.id ? u : a);
            else newList.push(u);
            setAthletes(newList);
            storageService.saveAthletes(newList);
            setShowFormModal(false);
            setSelectedAthlete(u);
          }} 
        />
      )}

      {/* MODAL: EDICIÓN COMPLETA DE LA RUTINA ASIGNADA */}
      {editingInstance && (
          <div className="fixed inset-0 z-[2000] bg-[#0F0F11] flex flex-col p-4 md:p-8 animate-in slide-in-from-bottom-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0 border-b border-white/5 pb-4">
                  <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <input 
                          type="text" 
                          className="bg-transparent text-2xl font-black uppercase italic text-red-500 outline-none border-b border-transparent focus:border-red-500"
                          value={editingInstance.name}
                          onChange={e => setEditingInstance({ ...editingInstance, name: e.target.value })}
                        />
                        <span className="text-white/40 text-xs font-mono">({editingInstance.scheduledDate})</span>
                      </div>
                      <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">
                        Sesión Individual para {selectedAthlete?.name}
                      </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                      <button 
                        onClick={() => setShowPropagateModal(true)}
                        className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-xl text-[9px] uppercase font-black transition-all flex items-center gap-1.5"
                      >
                        🔄 Propagar a Semanas
                      </button>
                      <button 
                        onClick={handleSaveAsMasterTemplate}
                        className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded-xl text-[9px] uppercase font-black transition-all flex items-center gap-1.5"
                      >
                        💾 Guardar como Master
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm("¿Seguro que deseas eliminar esta rutina de este día?")) {
                              if (clickedEvent) {
                                  calendarService.deleteEvent(clickedEvent.id);
                              } else {
                                  calendarService.clearDaySessions(selectedAthlete!.id, editingInstance.scheduledDate!);
                              }
                              setCalendarTrigger(prev => prev + 1);
                              setEditingInstance(null);
                              setClickedEvent(null);
                          }
                        }} 
                        className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 rounded-xl text-[9px] uppercase font-black transition-colors"
                      >
                        Eliminar Día 🗑
                      </button>
                      <button 
                        onClick={() => { setEditingInstance(null); setClickedEvent(null); }} 
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] uppercase font-black"
                      >
                        Cerrar
                      </button>
                      <button 
                        onClick={async () => {
                          await storageService.saveUserSpecificWorkout(editingInstance);
                          calendarService.saveEvent({ 
                              id: clickedEvent ? clickedEvent.id : `evt-${editingInstance.id}`, 
                              type: 'workout', 
                              title: editingInstance.name, 
                              start: `${editingInstance.scheduledDate}T12:00:00`, 
                              end: `${editingInstance.scheduledDate}T13:00:00`, 
                              allDay: true, 
                              coachId: 'jorge', 
                              athleteIds: [selectedAthlete!.id], 
                              workoutTemplateId: editingInstance.id, 
                              location: editingInstance.location 
                          });
                          setCalendarTrigger(prev => prev + 1);
                          setEditingInstance(null);
                          setClickedEvent(null);
                          alert("✅ Cambios de la rutina guardados correctamente para este atleta.");
                        }} 
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-[9px] uppercase font-black shadow-lg transition-all"
                      >
                        Guardar Cambios ✓
                      </button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-20">
                  <div onClick={() => setEditingInstance({...editingInstance, location: editingInstance.location ? undefined : 'Kinetix Functional Zone'})} className={`p-4 rounded-3xl border flex items-center justify-between cursor-pointer transition-all ${editingInstance.location ? 'bg-red-600/10 border-red-600' : 'bg-white/5 border-white/5'}`}>
                      <div>
                        <p className="text-xs font-black uppercase">
                          Modo: {editingInstance.location ? 'Presencial (Sede Kinetix)' : 'Entrenamiento Remoto'}
                        </p>
                      </div>
                      <div className={`w-12 h-6 rounded-full transition-colors ${editingInstance.location ? 'bg-red-600' : 'bg-white/10'}`} />
                  </div>

                  {editingInstance.exercises.map((ex, idx) => (
                      <div key={idx} className="relative group">
                          <ExerciseBlockEditor 
                            exercise={ex} 
                            onUpdate={(u) => {
                              const newExs = [...editingInstance.exercises];
                              newExs[idx] = u;
                              setEditingInstance({ ...editingInstance, exercises: newExs });
                            }} 
                          />
                          <div className="absolute top-4 right-4 z-10 flex gap-2">
                              <button 
                                  type="button"
                                  onClick={() => {
                                      if (confirm(`¿Eliminar el ejercicio "${ex.name}" de esta rutina?`)) {
                                          const newExs = editingInstance.exercises.filter((_, i) => i !== idx);
                                          setEditingInstance({ ...editingInstance, exercises: newExs });
                                      }
                                  }} 
                                  className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
                              >
                                  Eliminar Ejercicio ✕
                              </button>
                          </div>
                      </div>
                  ))}

                  {/* AGREGAR EJERCICIO DESDE BIBLIOTECA */}
                  <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-[32px] p-6 text-center space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        Añadir Ejercicio a la Sesión del Atleta
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <select 
                          className="bg-black border border-white/10 rounded-2xl p-3 text-xs font-bold text-white outline-none min-w-[240px]"
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const found = allExercises.find(ex => ex.id === e.target.value);
                            if (found) {
                              const newEx: WorkoutExercise = {
                                exerciseId: found.id,
                                name: found.name,
                                targetSets: 4,
                                targetReps: '10',
                                targetLoad: '0',
                                targetRest: 90,
                                targetRir: '2',
                                tempo: '3-0-1-0',
                                setType: 'straight',
                                coachCue: found.technique,
                                videoUrl: found.videoUrl,
                                method: 'standard'
                              };
                              setEditingInstance({ ...editingInstance, exercises: [...editingInstance.exercises, newEx] });
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">-- SELECCIONAR DE BIBLIOTECA --</option>
                          {allExercises.map(ex => (
                            <option key={ex.id} value={ex.id}>
                              {ex.muscleGroup.toUpperCase()}: {ex.name}
                            </option>
                          ))}
                        </select>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL: ASIGNACIÓN DE RUTINAS PREGUARDADAS + PROPAGACIÓN */}
      {assigningDate && (
          <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95">
              <div className="bg-[#0F0F11] w-full max-w-lg rounded-[40px] border border-white/10 p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-6">
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">Asignar Rutina</h2>
                    <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-1">
                        Día inicial: <span className="text-red-500 font-mono">{assigningDate}</span> // Atleta: {selectedAthlete?.name}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                            Seleccionar Rutina Preguardada / Plantilla
                          </label>
                          <select 
                              className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-red-600 transition-colors text-sm"
                              value={selectedTemplateIdToAssign}
                              onChange={(e) => setSelectedTemplateIdToAssign(e.target.value)}
                          >
                              <option value="">-- SELECCIONAR RUTINA PREGUARDADA --</option>
                              {templates.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                          </select>
                      </div>

                      {/* PROPAGACIÓN SEMANAL */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                            Propagación
                          </label>
                          <select 
                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs font-bold text-white"
                            value={assignWeeks}
                            onChange={e => setAssignWeeks(parseInt(e.target.value) || 1)}
                          >
                            <option value="1">Solo este día (1 semana)</option>
                            <option value="2">2 semanas consecutivas</option>
                            <option value="4">4 semanas (Mesociclo 1 mes)</option>
                            <option value="6">6 semanas</option>
                            <option value="8">8 semanas (Ciclo completo)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                            Sobrecarga Progresiva
                          </label>
                          <select 
                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs font-bold text-white"
                            value={assignProgWeight}
                            onChange={e => setAssignProgWeight(parseFloat(e.target.value) || 0)}
                          >
                            <option value="0">Carga Fija (0 kg/sem)</option>
                            <option value="2.5">+2.5 kg cada semana</option>
                            <option value="5">+5 kg cada semana</option>
                          </select>
                        </div>
                      </div>

                      {/* EDITAR INMEDIATAMENTE TRAS ASIGNAR */}
                      <label className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={assignImmediateEdit} 
                          onChange={e => setAssignImmediateEdit(e.target.checked)}
                          className="w-4 h-4 accent-red-600 rounded" 
                        />
                        <span className="text-xs font-bold uppercase text-white/70">
                          Abrir editor inmediatamente para personalizar pesos de este atleta
                        </span>
                      </label>

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
                                  if (!tpl || !selectedAthlete || !assigningDate) return;
                                  
                                  const baseDate = new Date(`${assigningDate}T12:00:00`);
                                  let firstInstance: Workout | null = null;

                                  for (let w = 0; w < assignWeeks; w++) {
                                      const curDate = new Date(baseDate);
                                      curDate.setDate(baseDate.getDate() + (w * 7));
                                      const curDateStr = `${curDate.getFullYear()}-${String(curDate.getMonth()+1).padStart(2,'0')}-${String(curDate.getDate()).padStart(2,'0')}`;

                                      const instance: Workout = JSON.parse(JSON.stringify(tpl));
                                      const newId = `inst-${selectedAthlete.id}-${curDateStr}-${Date.now()}-${w}`;
                                      instance.id = newId;
                                      instance.isTemplate = false;
                                      instance.assignedTo = selectedAthlete.id;
                                      instance.scheduledDate = curDateStr;

                                      if (w > 0 && assignProgWeight > 0) {
                                          instance.exercises = instance.exercises.map(ex => {
                                              if (ex.targetLoad) {
                                                  ex.targetLoad = ex.targetLoad.split(',').map(l => {
                                                      const parsed = parseFloat(l.trim());
                                                      return isNaN(parsed) ? l : (parsed + (assignProgWeight * w)).toString();
                                                  }).join(', ');
                                              }
                                              return ex;
                                          });
                                      }

                                      await storageService.saveUserSpecificWorkout(instance);
                                      calendarService.saveEvent({ 
                                          id: `evt-${newId}`, 
                                          type: 'workout', 
                                          title: instance.name, 
                                          start: `${curDateStr}T12:00:00`, 
                                          end: `${curDateStr}T13:00:00`, 
                                          allDay: true, 
                                          coachId: 'jorge', 
                                          athleteIds: [selectedAthlete.id], 
                                          workoutTemplateId: newId 
                                      });

                                      if (w === 0) firstInstance = instance;
                                  }
                                  
                                  setCalendarTrigger(prev => prev + 1);
                                  setAssigningDate(null);
                                  if (assignImmediateEdit && firstInstance) {
                                      setEditingInstance(firstInstance);
                                  }
                              }} 
                              className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                          >
                              Confirmar Asignación
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL: PROPAGACIÓN DE RUTINA ACTUAL */}
      {showPropagateModal && editingInstance && (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95">
          <div className="bg-[#0F0F11] w-full max-w-md rounded-[32px] border border-white/10 p-8 space-y-6">
            <h3 className="text-xl font-black uppercase italic text-white">Propagar Rutina a Futuro</h3>
            <p className="text-xs text-white/50">
              Copia esta rutina exactamente como la configuraste para {selectedAthlete?.name} hacia las siguientes semanas.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/30 tracking-widest block">Número de Semanas</label>
                <select 
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs font-bold text-white"
                  value={propagateWeeks}
                  onChange={e => setPropagateWeeks(parseInt(e.target.value) || 1)}
                >
                  <option value="1">1 semana adelante (+7 días)</option>
                  <option value="2">2 semanas adelante (+14 días)</option>
                  <option value="3">3 semanas adelante (+21 días)</option>
                  <option value="4">4 semanas (Mesociclo)</option>
                  <option value="8">8 semanas (Ciclo largo)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-white/30 tracking-widest block">Sobrecarga Progresiva por Semana (KG)</label>
                <input 
                  type="number" 
                  step="0.5"
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs font-bold text-yellow-400"
                  value={propagateWeightInc}
                  onChange={e => setPropagateWeightInc(parseFloat(e.target.value) || 0)}
                  placeholder="ej: 2.5"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/5">
              <button 
                type="button" 
                onClick={() => setShowPropagateModal(false)}
                className="flex-1 py-3.5 bg-white/5 rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handlePropagateCurrentSession}
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg"
              >
                Propagar Ahora 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {showScheduler && selectedAthlete && (
        <VenueSchedulerModal 
          athlete={selectedAthlete} 
          onClose={() => setShowScheduler(false)} 
          onApply={() => { setShowScheduler(false); setCalendarTrigger(prev => prev + 1); }} 
        />
      )}
    </div>
  );
};
