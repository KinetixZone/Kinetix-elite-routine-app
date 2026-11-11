
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Workout, Goal, UserLevel, PRRecord } from '../../types/kinetix';
import { ProgressDashboard } from '../analytics/ProgressDashboard';
import { calendarService } from '../../services/calendarService';
import { storageService, MuscleStatus } from '../../services/storageService';
import { aiService } from '../../services/aiService'; 

const TechnicalChatModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
        { role: 'ai', text: 'Kinetix Ops v125.0 Online. Terminal Técnica.\n\nResuelvo dudas sobre biomecánica, técnica y uso de la app. No estoy autorizado para crear rutinas ni dietas.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsLoading(true);
        const response = await aiService.getTechnicalAdvice(userMsg);
        setMessages(prev => [...prev, { role: 'ai', text: response }]);
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 animate-in slide-in-from-bottom-10 md:fade-in">
            <div className="bg-[#0F0F11] w-full md:max-w-md h-[85vh] md:h-[600px] md:rounded-[32px] rounded-t-[32px] border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.15)] flex flex-col overflow-hidden relative">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#0F0F11]">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                        <div>
                            <h3 className="text-sm font-black uppercase italic tracking-widest text-white">Kinetix Ops</h3>
                            <p className="text-[8px] font-black uppercase text-blue-400/50 tracking-widest">TECHNICAL & BIOMECHANICS</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors">✕</button>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gradient-to-b from-[#0F0F11] to-black">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-900/20 text-white border border-blue-900/40 rounded-br-none' : 'bg-[#1A1A1D] text-white/80 border border-white/5 rounded-bl-none'}`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><div className="bg-[#1A1A1D] px-4 py-3 rounded-2xl rounded-bl-none border border-white/5 flex gap-1"><div className="w-1.5 h-1.5 bg-blue-500/30 rounded-full animate-bounce" style={{ animationDelay: '0s' }} /><div className="w-1.5 h-1.5 bg-blue-500/30 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} /><div className="w-1.5 h-1.5 bg-blue-500/30 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} /></div></div>}
                </div>
                <div className="p-4 bg-[#0F0F11] border-t border-white/5">
                    <p className="text-[8px] text-white/20 uppercase font-bold mb-2 text-center tracking-widest italic">Solo consultas técnicas de biomecánica o plataforma</p>
                    <div className="flex gap-2">
                        <input type="text" className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-600 outline-none placeholder-white/20" placeholder="Ej: ¿Cómo optimizar mi sentadilla?" value={input} onChange={e => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
                        <button onClick={handleSend} disabled={!input.trim() || isLoading} className="bg-blue-600 text-white w-12 rounded-xl flex items-center justify-center hover:bg-blue-500 transition-colors">➤</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface Props {
  user: User;
  currentWorkout: Workout;
  availableWorkouts: Workout[];
  onStartSession: (workout: Workout) => void;
  onLogout: () => void;
}

export const AthleteHome: React.FC<Props> = ({ user, currentWorkout, availableWorkouts, onStartSession, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'train' | 'progress' | 'profile'>('train');
  const [showPlanB, setShowPlanB] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // PROFILE & PR MANAGEMENT STATES
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    level: user.level,
    goal: user.goal,
    weight: user.weight || 75,
    age: user.age || 26,
    medicalConditions: user.medicalConditions || ''
  });
  const [prsList, setPrsList] = useState<PRRecord[]>(() => storageService.getPRs());
  const [showAddPrModal, setShowAddPrModal] = useState(false);
  const [newPrInput, setNewPrInput] = useState({
    exerciseName: '',
    weight: 100,
    reps: 1
  });
  
  const coachWhatsApp = "https://wa.me/525627303189";

  const handleSaveProfile = () => {
    const updatedUser: User = {
      ...user,
      name: profileForm.name,
      level: profileForm.level,
      goal: profileForm.goal,
      weight: profileForm.weight,
      age: profileForm.age,
      medicalConditions: profileForm.medicalConditions
    };
    storageService.saveUser(updatedUser);
    
    // Also update in athletes list
    const athletes = storageService.getAthletes();
    const idx = athletes.findIndex(a => a.id === user.id);
    if (idx >= 0) {
      athletes[idx] = updatedUser;
      storageService.saveAthletes(athletes);
    }
    
    setIsEditingProfile(false);
  };

  const handleSaveNewPr = () => {
    if (!newPrInput.exerciseName.trim() || newPrInput.weight <= 0) return;
    const est1RM = Math.round(newPrInput.weight * (1 + newPrInput.reps / 30) * 10) / 10;
    const newRecord: PRRecord = {
      id: `pr-${Date.now()}`,
      exerciseId: `custom-${Date.now()}`,
      exerciseName: newPrInput.exerciseName.trim(),
      weight: newPrInput.weight,
      reps: newPrInput.reps,
      estimated1RM: est1RM,
      date: new Date().toISOString().split('T')[0]
    };
    storageService.savePR(newRecord);
    setPrsList(storageService.getPRs());
    setShowAddPrModal(false);
    setNewPrInput({ exerciseName: '', weight: 100, reps: 1 });
  };

  const isWorkoutEmpty = !currentWorkout || currentWorkout.id === 'empty-state' || currentWorkout.exercises.length === 0;

  const muscleStatus = useMemo(() => storageService.getMuscleStatus(), [activeTab]);

  const todaySummary = useMemo(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLogs = storageService.getAllLogs().filter(l => l.timestamp && l.timestamp.startsWith(todayStr));
      const totalTonnage = todayLogs.reduce((acc, l) => acc + (Number(l.weight || 0) * Number(l.reps || 0)), 0);
      const totalSets = todayLogs.length;
      const workoutName = todayLogs[0]?.workoutName || currentWorkout?.name || 'Sesión de Hoy';
      const rpe = todayLogs.find(l => l.feedback?.rpe)?.feedback?.rpe;
      return {
          hasLogs: todayLogs.length > 0,
          tonnage: totalTonnage,
          sets: totalSets,
          workoutName,
          rpe
      };
  }, [currentWorkout, activeTab]);

  const completionStatus = useMemo(() => {
      if (todaySummary.hasLogs) return { isDone: true, label: 'SESIÓN COMPLETADA' };
      if (isWorkoutEmpty) return { isDone: false, label: '' };
      if (storageService.isSessionComplete(currentWorkout.id)) return { isDone: true, label: 'SESIÓN COMPLETADA' };
      return { isDone: false, label: '' };
  }, [currentWorkout, isWorkoutEmpty, todaySummary.hasLogs]);

  const systemReadiness = useMemo(() => {
    const streakBonus = Math.min((user.streak || 0) * 2, 20);
    const readiness = 70 + streakBonus; 
    return Math.min(readiness, 100);
  }, [user.streak]);

  const tomorrowIntel = useMemo(() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tplId = calendarService.getScheduledSession(tomorrow, user.id);
      if (!tplId) return null;

      const workout = storageService.getWorkoutById(tplId);
      if (!workout) return null;

      let focus = "Operación Variada";
      let tip = "Carga estándar de combustible.";
      
      const names = workout.exercises.map(e => e.name.toLowerCase());
      const hasLegs = names.some(n => n.includes('sentadilla') || n.includes('leg') || n.includes('pierna') || n.includes('prensa'));
      const hasHIIT = workout.exercises.some(e => e.method === 'tabata' || e.method === 'emom');
      const hasPower = workout.exercises.some(e => e.method === 'ahap');

      if (hasLegs) { focus = "Tren Inferior"; tip = "Lleva calzado plano o estable."; }
      else if (hasHIIT) { focus = "Metabólico / HIIT"; tip = "Hidratación máxima requerida."; }
      else if (hasPower) { focus = "Fuerza Máxima"; tip = "Mentalidad de récord. Descansa bien."; }

      return { title: workout.publicTitle || workout.name, focus, tip };
  }, [user.id]);

  const weeklyHorizon = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMon = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diffToMon));
    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const tplId = calendarService.getScheduledSession(d, user.id);
        const hasLogs = storageService.getAllLogs().some(l => l.timestamp.startsWith(dateStr));
        week.push({ dayName: ['D','L','M','X','J','V','S'][d.getDay()], dayNum: d.getDate(), isToday: dateStr === new Date().toISOString().split('T')[0], hasSession: !!tplId, isDone: hasLogs });
    }
    return week;
  }, [user.id, completionStatus.isDone]);

  const systemConfig = storageService.getSystemConfig();

  return (
    <div className="min-h-screen bg-[#050507] text-white relative overflow-hidden">
      {/* CAPA DISCRETA DE SEGURIDAD ANTIPIRATERÍA (FORENSIC WATERMARK) */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.035] overflow-hidden select-none flex flex-col justify-around rotate-[-15deg] scale-150">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="whitespace-nowrap text-[9px] font-mono font-bold tracking-[0.35em] text-white text-center">
            KINETIX FUNCTIONAL ZONE • LIC. JORGE GONZÁLEZ. • PROPIEDAD INTELECTUAL • ATLETA: {user.name.toUpperCase()}
          </div>
        ))}
      </div>
      <main className="max-w-md mx-auto pt-8 px-6 pb-32">
         
         {activeTab === 'train' && (
             <div className="space-y-8 animate-in slide-in-from-left-4">
                 <div className="flex justify-between items-start pb-6 border-b border-white/5">
                     <div className="flex items-center gap-4">
                        <div className="relative w-14 h-14 rounded-2xl bg-black border border-cyan-500/40 p-1 overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.3)] shrink-0">
                           <img 
                               src="/assets/aistudio/1759185151992_02f8a860.jpg" 
                               alt="Kinetix Functional Zone" 
                               className="w-full h-full object-cover rounded-xl"
                           />
                        </div>
                        <div className="space-y-0.5">
                           <div className="flex items-center gap-2">
                              <p className="text-[8px] font-black uppercase tracking-[0.25em] text-[#FF2A2A]">
                                 Kinetix <span className="text-[#00F0FF]">Functional Zone</span>
                              </p>
                           </div>
                           <h1 className="text-3xl font-black uppercase italic tracking-tighter leading-none text-white">
                              HOLA, {user.name.split(' ')[0]}
                           </h1>
                           <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                              {user.medicalConditions?.includes('Personalizado') ? '⭐ Programa Jorge González' : user.medicalConditions?.includes('Vacaciones') ? '🏖️ Modo Vacaciones Activo' : 'Atleta Oficial Kinetix'}
                           </p>
                        </div>
                     </div>
                     <div className="bg-[#121215] p-3 rounded-2xl border border-white/10 flex flex-col items-center shrink-0">
                         <p className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-1">Readiness</p>
                         <p className="text-xl font-black text-cyan-400 italic">{systemReadiness}%</p>
                     </div>
                 </div>

                 {/* TACTICAL BODY SCAN */}
                 <div className="bg-[#0F0F11] border border-white/5 rounded-[40px] p-6 space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] italic">Tactical Body Scan</p>
                        <span className="text-[7px] font-black text-blue-500 uppercase">Live Biometric Feed</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {muscleStatus.map(m => (
                            <div key={m.zone} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{m.zone}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'fatigued' ? 'bg-red-500 shadow-[0_0_5px_red]' : m.status === 'recovering' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${m.status === 'fatigued' ? 'bg-red-600' : 'bg-white/20'}`} style={{ width: `${m.level}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                 </div>

                 <div className="flex justify-between items-center bg-[#151518]/30 backdrop-blur-xl p-4 rounded-[32px] border border-white/5 gap-2">
                    {weeklyHorizon.map((d, i) => (
                        <div key={i} className={`flex-1 h-[60px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${d.isToday ? 'bg-white text-black shadow-xl scale-110' : 'bg-transparent text-white/20'}`}>
                            <span className="text-[7px] font-black uppercase tracking-widest">{d.dayName}</span>
                            <span className="text-sm font-black">{d.dayNum}</span>
                            <div className={`w-1 h-1 rounded-full ${d.isDone ? 'bg-green-500' : d.hasSession ? 'bg-red-600' : 'bg-white/5'}`} />
                        </div>
                    ))}
                 </div>

                 <div>
                     <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 flex items-center justify-between">
                        <span>{completionStatus.isDone ? 'SESIÓN FINALIZADA' : 'MISIÓN PRIORITARIA'}</span>
                        <span className="text-white/10">KINETIX v6.8</span>
                     </p>
                     
                     {user.isActive ? (
                         completionStatus.isDone ? (
                             /* TARJETA DE SESIÓN COMPLETADA (PROTECCIÓN INTELECTUAL Y DOSIFICACIÓN) */
                             <div className="bg-[#0A0A0D] border border-green-500/30 rounded-[40px] p-8 space-y-6 shadow-[0_0_40px_rgba(34,197,94,0.12)] relative overflow-hidden">
                                 <div className="flex justify-between items-center">
                                     <div className="flex items-center gap-2">
                                         <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                                         <span className="text-[9px] font-black uppercase tracking-[0.25em] text-green-400">
                                             Entrenamiento Cumplido
                                         </span>
                                     </div>
                                     <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full text-[8px] font-black uppercase">
                                         ✓ Guardado
                                     </span>
                                 </div>

                                 <div>
                                     <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Sesión Realizada Hoy</p>
                                     <h3 className="text-2xl font-black uppercase italic tracking-tight text-white mt-1">
                                         {todaySummary.workoutName}
                                     </h3>
                                 </div>

                                 <div className="grid grid-cols-3 gap-3">
                                     <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-center">
                                         <p className="text-[8px] font-black uppercase text-white/40">Tonelaje</p>
                                         <p className="text-lg font-black text-cyan-400 italic mt-0.5">
                                             {todaySummary.tonnage > 0 ? todaySummary.tonnage.toLocaleString() : '—'}
                                             <span className="text-[8px] text-white/40 block not-italic">KG</span>
                                         </p>
                                     </div>
                                     <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-center">
                                         <p className="text-[8px] font-black uppercase text-white/40">Series</p>
                                         <p className="text-lg font-black text-white italic mt-0.5">
                                             {todaySummary.sets || '—'}
                                             <span className="text-[8px] text-white/40 block not-italic">SETS</span>
                                         </p>
                                     </div>
                                     <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-center">
                                         <p className="text-[8px] font-black uppercase text-white/40">Esfuerzo</p>
                                         <p className="text-lg font-black text-red-500 italic mt-0.5">
                                             {todaySummary.rpe ? `@${todaySummary.rpe}` : 'Óptimo'}
                                             <span className="text-[8px] text-white/40 block not-italic">RPE</span>
                                         </p>
                                     </div>
                                 </div>

                                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-start gap-3">
                                     <span className="text-base shrink-0">🛡️</span>
                                     <p className="text-[10px] text-white/60 leading-relaxed font-medium">
                                         <strong className="text-white block font-black uppercase text-[9px] tracking-wider mb-0.5">
                                             Dosificación Biomecánica & Recuperación:
                                         </strong>
                                         Tu rutina de hoy ha sido archivada para proteger tu sistema nervioso central. Tus cargas y tonelaje ya están computados en tu historial.
                                     </p>
                                 </div>

                                 <div className="pt-1">
                                     <a 
                                         href="https://kinetix-progress.vercel.app/" 
                                         target="_blank" 
                                         rel="noreferrer"
                                         className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-center text-white/80 hover:text-cyan-400 transition-all flex items-center justify-center gap-2"
                                     >
                                         <span>Ver RMs & Cargas en Kinetix Progress</span>
                                         <span>↗</span>
                                     </a>
                                 </div>
                             </div>
                         ) : (
                             /* TARJETA DE INICIO DE ENTRENAMIENTO (LIMPIA Y SIN LÍNEA ROJA PARÁSITA) */
                             <div className={`group relative rounded-[48px] p-10 border transition-all duration-1000 overflow-hidden ${isWorkoutEmpty ? 'bg-[#0F0F11] border-white/5' : 'bg-gradient-to-br from-[#121215] to-black border-white/10 shadow-2xl'}`}>
                                 <div className="relative z-10">
                                     <div className="flex justify-between items-start mb-8">
                                         <div className={`px-4 py-1.5 rounded-full border text-[8px] font-black tracking-[0.3em] uppercase ${isWorkoutEmpty ? 'bg-white/5 text-white/20 border-white/5' : 'bg-red-600 text-white border-red-500 shadow-lg animate-pulse'}`}>
                                             {isWorkoutEmpty ? 'DESCANSO' : 'DESPLEGAR AHORA'}
                                         </div>
                                     </div>
                                     <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-tight mb-8 text-white">
                                         {isWorkoutEmpty ? 'RECARGA Y RECUPERA' : (currentWorkout.publicTitle || currentWorkout.name)}
                                     </h2>
                                     
                                     {!isWorkoutEmpty ? (
                                         <button 
                                             onClick={() => onStartSession(currentWorkout)}
                                             className="w-full py-6 bg-white text-black hover:bg-red-600 hover:text-white rounded-[24px] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                                         >
                                             INICIAR SESIÓN ⚡
                                         </button>
                                     ) : (
                                         <div className="space-y-4">
                                             <button onClick={() => setShowPlanB(!showPlanB)} className="w-full py-5 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/10">
                                                 {showPlanB ? 'CANCELAR' : 'CARGAR SESIÓN MANUAL'}
                                             </button>
                                             {showPlanB && (
                                                 <div className="space-y-2 animate-in slide-in-from-top-4">
                                                     {availableWorkouts.map(w => (
                                                         <button key={w.id} onClick={() => onStartSession(w)} className="w-full py-4 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                                                             {w.name}
                                                         </button>
                                                     ))}
                                                 </div>
                                             )}
                                         </div>
                                     )}
                                 </div>
                             </div>
                         )
                     ) : (
                         <div className="bg-[#0F0F11] border border-red-600/30 rounded-[40px] p-12 text-center">
                             <h3 className="text-2xl font-black uppercase italic text-red-600 mb-4">Membresía Inactiva</h3>
                             <a href={coachWhatsApp} target="_blank" rel="noreferrer" className="block w-full py-5 bg-[#25D366] text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px]">CONTACTAR COACH</a>
                         </div>
                     )}
                 </div>

                 {tomorrowIntel && user.isActive && (
                     <div className="bg-[#121215] border border-white/5 rounded-[32px] p-8">
                         <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 italic">Next Intel:</p>
                         <h4 className="text-xl font-black uppercase italic text-white leading-tight mb-4">{tomorrowIntel.title}</h4>
                         <div className="flex flex-col gap-3">
                             <div className="flex items-center gap-2">
                                 <span className="text-[8px] font-black uppercase bg-blue-900/30 text-blue-400 px-3 py-1 rounded-lg">FOCO: {tomorrowIntel.focus}</span>
                             </div>
                             <p className="text-[10px] text-white/40 font-bold leading-relaxed">💡 {tomorrowIntel.tip}</p>
                         </div>
                     </div>
                 )}

                 {systemConfig.enableAI && user.isActive && (
                     <button onClick={() => setShowChat(true)} className="w-full bg-blue-600/5 border border-blue-500/10 hover:border-blue-500/30 p-6 rounded-[32px] flex items-center justify-between transition-all group">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 shadow-lg group-hover:scale-110 transition-transform">📡</div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white">Kinetix Ops Support</p>
                                <p className="text-[8px] text-blue-400/50 uppercase font-black">Asistencia Biomecánica v125</p>
                            </div>
                        </div>
                        <span className="text-blue-500 font-black text-[9px] tracking-widest">CONNECT</span>
                     </button>
                 )}
                  {/* MARCA DE AGUA Y PROTECCIÓN DE PROPIEDAD INTELECTUAL */}
                  <div className="text-center pt-8 pb-4 select-none pointer-events-none">
                     <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/30">
                        🔒 Propiedad Intelectual Kinetix Functional Zone • Lic. Jorge González.
                     </p>
                     <p className="text-[7px] text-white/20 tracking-wider mt-0.5">
                        Metodología Exclusiva Lic. Jorge González. • Asignado a {user.name} • Prohibida su Copia o Difusión
                     </p>
                  </div>
             </div>
         )}

         {activeTab === 'progress' && <ProgressDashboard />}
         
         {activeTab === 'profile' && (
             <div className="pb-28 animate-in fade-in space-y-6">
                 {/* AVATAR & BASIC BADGE */}
                 <div className="flex flex-col items-center pt-6">
                     <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-600 via-red-900 to-black border-4 border-white/10 flex items-center justify-center text-4xl font-black shadow-[0_0_30px_rgba(255,0,0,0.3)] mb-4">
                       {user.name.charAt(0)}
                     </div>
                     <h2 className="text-2xl font-black uppercase italic tracking-tighter">{user.name}</h2>
                     <div className="flex items-center gap-2 mt-1">
                       <span className="px-3 py-0.5 bg-red-600/20 border border-red-500/30 rounded-full text-[9px] font-black uppercase text-red-400">
                         {user.level}
                       </span>
                       <span className="text-white/20">•</span>
                       <span className="text-[10px] text-white/40 font-black uppercase tracking-wider">{user.goal}</span>
                     </div>
                 </div>

                 {/* CREDENTIALS CARD */}
                 <div className="bg-[#0F0F11] border border-white/5 rounded-[32px] p-6 space-y-2">
                   <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30">Credenciales de Acceso Asignadas</p>
                   <div className="flex justify-between items-center text-xs pt-1">
                     <span className="text-white/50 font-mono">{user.email}</span>
                     <span className="bg-white/5 px-2.5 py-1 rounded-lg text-white/60 font-mono text-[10px]">
                       {user.password ? `Pass: ${user.password}` : 'Clave asignada por Coach'}
                     </span>
                   </div>
                 </div>

                 {/* PROFILE EDIT TOGGLE & FORM */}
                 <div className="bg-[#0F0F11] border border-white/5 rounded-[32px] p-6 space-y-4">
                   <div className="flex justify-between items-center">
                     <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Ficha del Atleta</h3>
                     <button 
                       onClick={() => setIsEditingProfile(!isEditingProfile)} 
                       className="text-[9px] font-black uppercase text-red-500 hover:text-red-400 tracking-wider"
                     >
                       {isEditingProfile ? 'Cancelar' : 'Editar Ficha ✏️'}
                     </button>
                   </div>

                   {!isEditingProfile ? (
                     <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                       <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                         <p className="text-[8px] font-black uppercase text-white/30">Peso Corporal</p>
                         <p className="text-base font-black text-white italic">{user.weight || 75} <span className="text-[10px] text-white/40 not-italic">KG</span></p>
                       </div>
                       <div className="bg-black/40 p-3 rounded-2xl border border-white/5">
                         <p className="text-[8px] font-black uppercase text-white/30">Edad</p>
                         <p className="text-base font-black text-white italic">{user.age || 26} <span className="text-[10px] text-white/40 not-italic">AÑOS</span></p>
                       </div>
                       <div className="col-span-2 bg-black/40 p-3 rounded-2xl border border-white/5">
                         <p className="text-[8px] font-black uppercase text-white/30">Condiciones Médicas / Lesiones</p>
                         <p className="text-xs font-medium text-white/70 italic mt-0.5">{user.medicalConditions || user.injuries || 'Ninguna registrada'}</p>
                       </div>
                     </div>
                   ) : (
                     <div className="space-y-3 pt-2">
                       <div>
                         <label className="text-[8px] font-black uppercase text-white/30">Nombre Completo</label>
                         <input 
                           type="text" 
                           className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-red-600"
                           value={profileForm.name} 
                           onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} 
                         />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <label className="text-[8px] font-black uppercase text-white/30">Nivel de Atleta</label>
                           <select 
                             className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-red-600"
                             value={profileForm.level}
                             onChange={e => setProfileForm({ ...profileForm, level: e.target.value as UserLevel })}
                           >
                             <option value={UserLevel.BEGINNER}>{UserLevel.BEGINNER}</option>
                             <option value={UserLevel.INTERMEDIATE}>{UserLevel.INTERMEDIATE}</option>
                             <option value={UserLevel.ADVANCED}>{UserLevel.ADVANCED}</option>
                           </select>
                         </div>
                         <div>
                           <label className="text-[8px] font-black uppercase text-white/30">Objetivo</label>
                           <select 
                             className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-red-600"
                             value={profileForm.goal}
                             onChange={e => setProfileForm({ ...profileForm, goal: e.target.value as Goal })}
                           >
                             <option value={Goal.GAIN_MUSCLE}>{Goal.GAIN_MUSCLE}</option>
                             <option value={Goal.LOSE_FAT}>{Goal.LOSE_FAT}</option>
                             <option value={Goal.PERFORMANCE}>{Goal.PERFORMANCE}</option>
                           </select>
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <label className="text-[8px] font-black uppercase text-white/30">Peso (Kg)</label>
                           <input 
                             type="number" 
                             className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-red-600"
                             value={profileForm.weight} 
                             onChange={e => setProfileForm({ ...profileForm, weight: parseFloat(e.target.value) || 0 })} 
                           />
                         </div>
                         <div>
                           <label className="text-[8px] font-black uppercase text-white/30">Edad</label>
                           <input 
                             type="number" 
                             className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-red-600"
                             value={profileForm.age} 
                             onChange={e => setProfileForm({ ...profileForm, age: parseInt(e.target.value) || 0 })} 
                           />
                         </div>
                       </div>
                       <div>
                         <label className="text-[8px] font-black uppercase text-white/30">Observaciones Técnicas / Lesiones</label>
                         <textarea 
                           className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white font-medium outline-none focus:border-red-600 h-16"
                           value={profileForm.medicalConditions} 
                           onChange={e => setProfileForm({ ...profileForm, medicalConditions: e.target.value })} 
                           placeholder="Ej: Molestia en rodilla derecha..."
                         />
                       </div>
                       <button 
                         onClick={handleSaveProfile}
                         className="w-full py-3.5 bg-red-600 hover:bg-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-lg transition-transform active:scale-95"
                       >
                         Guardar Cambios
                       </button>
                     </div>
                   )}
                 </div>

                 {/* PERSONAL RECORDS (PRs) & 1RM TRACKER */}
                 <div className="bg-[#0F0F11] border border-white/5 rounded-[32px] p-6 space-y-4">
                   <div className="flex justify-between items-center">
                     <div>
                       <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Récords Personales (PR & 1RM)</h3>
                       <p className="text-[7px] text-white/30 font-black uppercase tracking-wider mt-0.5">Fórmula Epley: Peso × (1 + Reps/30)</p>
                     </div>
                     <button 
                       onClick={() => setShowAddPrModal(true)}
                       className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[8px] font-black uppercase tracking-wider text-white"
                     >
                       + Nuevo PR
                     </button>
                   </div>

                   <div className="space-y-2 pt-1">
                     {prsList.length > 0 ? (
                       prsList.map((pr, idx) => (
                         <div key={idx} className="bg-black/40 border border-white/5 p-3.5 rounded-2xl flex justify-between items-center">
                           <div>
                             <p className="text-xs font-black uppercase italic text-white">{pr.exerciseName}</p>
                             <p className="text-[8px] text-white/30 font-bold uppercase mt-0.5">
                               {pr.weight} kg × {pr.reps} reps • {pr.date}
                             </p>
                           </div>
                           <div className="text-right">
                             <span className="text-[8px] text-red-500 font-black uppercase block">1RM Estimado</span>
                             <span className="text-base font-black text-white italic">{pr.estimated1RM} <span className="text-[9px] text-white/40 not-italic">KG</span></span>
                           </div>
                         </div>
                       ))
                     ) : (
                       <div className="py-6 text-center text-white/20 text-[9px] font-black uppercase tracking-widest">
                         Sin récords registrados aún. Se actualizan automáticamente en el tracker.
                       </div>
                     )}
                   </div>
                 </div>

                 {/* MODAL REGISTRAR PR MANUAL */}
                 {showAddPrModal && (
                   <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in-95">
                     <div className="bg-[#121215] w-full max-w-sm rounded-[32px] border border-white/10 p-6 space-y-4">
                       <div className="flex justify-between items-center">
                         <h4 className="text-xs font-black uppercase tracking-widest text-white">Registrar Récord (PR)</h4>
                         <button onClick={() => setShowAddPrModal(false)} className="text-xs text-white/40 hover:text-white">✕</button>
                       </div>
                       <div>
                         <label className="text-[8px] font-black uppercase text-white/30">Nombre Ejercicio</label>
                         <input 
                           type="text" 
                           placeholder="Ej: Press de Banca" 
                           className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-red-600"
                           value={newPrInput.exerciseName}
                           onChange={e => setNewPrInput({ ...newPrInput, exerciseName: e.target.value })}
                         />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                         <div>
                           <label className="text-[8px] font-black uppercase text-white/30">Peso (Kg)</label>
                           <input 
                             type="number" 
                             className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-red-600"
                             value={newPrInput.weight}
                             onChange={e => setNewPrInput({ ...newPrInput, weight: parseFloat(e.target.value) || 0 })}
                           />
                         </div>
                         <div>
                           <label className="text-[8px] font-black uppercase text-white/30">Reps Logradas</label>
                           <input 
                             type="number" 
                             className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-red-600"
                             value={newPrInput.reps}
                             onChange={e => setNewPrInput({ ...newPrInput, reps: parseInt(e.target.value) || 1 })}
                           />
                         </div>
                       </div>
                       <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center">
                         <p className="text-[8px] font-black uppercase text-red-400">1RM Estimado Resultante</p>
                         <p className="text-xl font-black text-white italic">
                           {Math.round(newPrInput.weight * (1 + newPrInput.reps / 30) * 10) / 10} KG
                         </p>
                       </div>
                       <button 
                         onClick={handleSaveNewPr}
                         className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg"
                       >
                         Guardar PR
                       </button>
                     </div>
                   </div>
                 )}

                 {/* LOGOUT & SUPPORT BUTTONS */}
                 <div className="bg-[#0F0F11] border border-white/5 rounded-[32px] p-6 space-y-3">
                    <a href={coachWhatsApp} target="_blank" rel="noreferrer" className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-colors">
                        SOPORTE DIRECTO COACH 📲
                    </a>
                    <button onClick={onLogout} className="w-full py-4 bg-red-900/10 text-red-500 hover:bg-red-900/20 border border-red-600/20 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-colors">
                      CERRAR SESIÓN TERMINAL 🚪
                    </button>
                 </div>
             </div>
         )}
      </main>

      <nav className="fixed bottom-8 left-8 right-8 bg-black/60 backdrop-blur-3xl border border-white/10 rounded-full p-2 z-50 flex justify-between items-center px-10 shadow-2xl">
            <button onClick={() => setActiveTab('train')} className={`p-4 rounded-full transition-all duration-500 ${activeTab === 'train' ? 'bg-white text-black scale-110' : 'text-white/30'}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3L4 14h7v7l9-11h-7z"/></svg>
            </button>
            <button onClick={() => setActiveTab('progress')} className={`p-4 rounded-full transition-all duration-500 ${activeTab === 'progress' ? 'bg-white text-black scale-110' : 'text-white/30'}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
            </button>
            <button onClick={() => setActiveTab('profile')} className={`p-4 rounded-full transition-all duration-500 ${activeTab === 'profile' ? 'bg-white text-black scale-110' : 'text-white/30'}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </button>
      </nav>
      {showChat && <TechnicalChatModal onClose={() => setShowChat(false)} />}
    </div>
  );
};
