import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Workout, PRRecord } from '../../types/kinetix';
import { ProgressDashboard } from '../analytics/ProgressDashboard';
import { calendarService } from '../../services/calendarService';
import { storageService } from '../../services/storageService';
import { aiService } from '../../services/aiService';

const TechnicalChatModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
        { role: 'ai', text: 'Asistente Técnico Kinetix en línea.\n\nResuelvo dudas sobre biomecánica, ejecución de ejercicios y uso de la app.' }
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
            <div className="bg-[#0F0F11] w-full md:max-w-md h-[85vh] md:h-[600px] md:rounded-[32px] rounded-t-[32px] border border-cyan-500/20 shadow-2xl flex flex-col overflow-hidden relative">
                <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0F0F11]">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Asistencia Técnica Kinetix</h3>
                        <p className="text-[10px] font-bold text-cyan-400">Biomecánica & Técnica</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors">✕</button>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gradient-to-b from-[#0F0F11] to-black">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-red-600/20 text-white border border-red-500/40 rounded-br-none' : 'bg-[#1A1A1D] text-white/85 border border-white/10 rounded-bl-none'}`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                    {isLoading && <div className="flex justify-start"><div className="bg-[#1A1A1D] px-4 py-3 rounded-2xl rounded-bl-none border border-white/5 text-xs text-white/40">Analizando...</div></div>}
                </div>
                <div className="p-4 bg-[#0F0F11] border-t border-white/10">
                    <div className="flex gap-2">
                        <input type="text" className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500 outline-none placeholder-white/30" placeholder="Ej: ¿Cómo coloco la espalda en remo?" value={input} onChange={e => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
                        <button onClick={handleSend} disabled={!input.trim() || isLoading} className="bg-red-600 text-white w-12 rounded-xl flex items-center justify-center hover:bg-red-500 transition-colors">➤</button>
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

const METHOD_LABEL: Record<string, string> = {
  standard: 'Estándar',
  biserie: 'Biserie',
  triserie: 'Triserie',
  giant_set: 'Serie Gigante',
  dropset: 'Drop Set',
  tabata: 'Tabata HIIT',
  emom: 'EMOM',
  ahap: 'Fuerza Máx',
  restpause: 'Rest-Pause',
  topset_backoff: 'Top Set + Back-off',
  clusters: 'Clusters',
  superset: 'Superserie'
};

export const AthleteHome: React.FC<Props> = ({ user, currentWorkout, onStartSession, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'train' | 'progress' | 'profile'>('train');
  const [showChat, setShowChat] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [prsList] = useState<PRRecord[]>(() => storageService.getPRs());
  const [unitPref, setUnitPref] = useState<'kg' | 'lbs'>(user.preferredUnit || 'kg');

  const coachWhatsApp = "https://wa.me/525627303189";
  const isWorkoutEmpty = !currentWorkout || currentWorkout.id === 'empty-state' || currentWorkout.exercises.length === 0;

  const todaySummary = useMemo(() => {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLogs = storageService.getAllLogs().filter(l => l.timestamp && l.timestamp.startsWith(todayStr));
      const totalTonnage = todayLogs.reduce((acc, l) => acc + (Number(l.weight || 0) * Number(l.reps || 0)), 0);
      const totalSets = todayLogs.length;
      const workoutName = todayLogs[0]?.workoutName || currentWorkout?.publicTitle || currentWorkout?.name || 'Sesión de Hoy';
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

  const workoutStats = useMemo(() => {
      if (isWorkoutEmpty) return { exCount: 0, totalSets: 0, estMinutes: 0 };
      const exCount = currentWorkout.exercises.length;
      const totalSets = currentWorkout.exercises.reduce((acc, ex) => acc + (ex.targetSets || 3), 0);
      const estMinutes = Math.max(25, Math.round(totalSets * 2.4));
      return { exCount, totalSets, estMinutes };
  }, [currentWorkout, isWorkoutEmpty]);

  const weeklyHorizon = useMemo(() => {
    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
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
        week.push({
          dayName: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()],
          dayNum: d.getDate(),
          dateStr,
          isToday: dateStr === todayIso,
          hasSession: !!tplId,
          isDone: hasLogs
        });
    }
    return week;
  }, [user.id, completionStatus.isDone]);

  const systemConfig = storageService.getSystemConfig();

  const togglePreferredUnit = (u: 'kg' | 'lbs') => {
    setUnitPref(u);
    const updatedUser = { ...user, preferredUnit: u };
    storageService.saveUser(updatedUser);
  };

  return (
    <div 
      className="min-h-screen bg-[#050507] text-white relative overflow-x-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* MARCA DE AGUA FORENSE VISIBLE Y DISCRETA ANTICOPIA */}
      <div className="fixed inset-0 pointer-events-none z-10 opacity-[0.065] overflow-hidden select-none flex flex-col justify-around rotate-[-18deg] scale-125">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="whitespace-nowrap text-[10px] font-mono font-bold tracking-[0.28em] text-white text-center">
            🔒 PROPIEDAD INTELECTUAL KINETIX FUNCTIONAL ZONE • LIC. JORGE GONZÁLEZ • {user.name.toUpperCase()}
          </div>
        ))}
      </div>

      {/* HEADER COMPACTO TIPO SMART FIT / APP DE ÉLITE */}
      <header className="sticky top-0 z-30 bg-[#050507]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src="/assets/aistudio/1759185151992_02f8a860.jpg" 
              alt="Kinetix Functional Zone" 
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl object-cover border border-cyan-500/40 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-black uppercase italic tracking-tight text-white truncate">
                Hola, {user.name.split(' ')[0]}
              </p>
              <p className="text-[10px] text-white/50 truncate">
                {user.medicalConditions?.includes('Personalizado') ? 'Programa Jorge González' : user.medicalConditions?.includes('Vacaciones') ? 'Modo Vacaciones' : 'Kinetix Functional Zone'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs font-bold">
            <span className="text-cyan-400 tabular-nums">🔥 {user.streak || 0} días</span>
            <button 
              onClick={() => setActiveTab('profile')}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold transition-colors whitespace-nowrap"
            >
              Mi Cuenta
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-20 max-w-5xl mx-auto pt-6 px-4 md:px-8 pb-28">
         
         {activeTab === 'train' && (
             <div className="space-y-6 animate-in fade-in">

                 {/* CINTA SEMANAL INTERACTIVA */}
                 <section aria-label="Calendario semanal" className="bg-[#0F0F11] border border-white/10 rounded-3xl p-4">
                    <div className="flex items-center justify-between px-1 mb-3">
                       <h2 className="text-xs font-black uppercase tracking-wider text-white/70">Tu Semana de Entrenamiento</h2>
                       <span className="text-[11px] text-white/40 font-semibold">Lic. Jorge González</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                       {weeklyHorizon.map((d, i) => {
                           const isSelected = selectedDayIdx === i;
                           return (
                             <button
                               key={d.dateStr}
                               type="button"
                               onClick={() => setSelectedDayIdx(isSelected ? null : i)}
                               className={`py-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all min-h-[56px] ${
                                 d.isToday
                                   ? 'bg-red-600 text-white shadow-lg'
                                   : isSelected
                                   ? 'bg-white/15 text-white border border-white/25'
                                   : 'bg-black/40 text-white/50 hover:bg-white/5'
                               }`}
                             >
                               <span className="text-[10px] font-bold uppercase">{d.dayName}</span>
                               <span className="text-sm font-black tabular-nums">{d.dayNum}</span>
                               <span className={`text-[9px] font-bold ${d.isDone ? 'text-emerald-400' : d.hasSession ? 'text-cyan-400' : 'text-white/25'}`}>
                                 {d.isDone ? '✓' : d.hasSession ? '●' : '–'}
                               </span>
                             </button>
                           );
                       })}
                    </div>

                    {selectedDayIdx !== null && !weeklyHorizon[selectedDayIdx]?.isToday && (
                      <div className="mt-3 p-3 rounded-2xl bg-black/60 border border-white/10 text-xs text-white/70 flex items-center justify-between">
                        <span>
                          {weeklyHorizon[selectedDayIdx].isDone
                            ? `${weeklyHorizon[selectedDayIdx].dayName} ${weeklyHorizon[selectedDayIdx].dayNum}: Sesión completada y archivada.`
                            : weeklyHorizon[selectedDayIdx].hasSession
                            ? `${weeklyHorizon[selectedDayIdx].dayName} ${weeklyHorizon[selectedDayIdx].dayNum}: Entrenamiento programado — se desbloquea ese día para proteger tu dosificación.`
                            : `${weeklyHorizon[selectedDayIdx].dayName} ${weeklyHorizon[selectedDayIdx].dayNum}: Día de recuperación programado.`}
                        </span>
                        <button onClick={() => setSelectedDayIdx(null)} className="text-white/40 hover:text-white px-2">✕</button>
                      </div>
                    )}
                 </section>

                 {/* BLOQUE PRINCIPAL: ESTO HARÁS HOY */}
                 {!user.isActive ? (
                    <div className="bg-[#0F0F11] border border-red-600/30 rounded-3xl p-8 text-center space-y-4">
                        <h3 className="text-2xl font-black uppercase italic text-red-500">Membresía Inactiva</h3>
                        <p className="text-xs text-white/60 max-w-md mx-auto">Tu acceso se encuentra pausado. Comunícate con Kinetix Functional Zone para reactivar tu plan.</p>
                        <a href={coachWhatsApp} target="_blank" rel="noreferrer" className="inline-block px-8 py-4 bg-[#25D366] text-white rounded-2xl font-black uppercase tracking-wider text-xs">
                          Contactar al Coach por WhatsApp
                        </a>
                    </div>
                 ) : completionStatus.isDone ? (
                    /* SESIÓN YA TERMINADA HOY (BLOQUEO ANTICOPIA POST-SESIÓN) */
                    <div className="bg-[#0F0F11] border border-emerald-500/30 rounded-3xl p-6 md:p-8 space-y-6">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-emerald-400">✓ Sesión Completada Hoy</p>
                                <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-white mt-1">
                                    {todaySummary.workoutName}
                                </h2>
                            </div>
                            <span className="text-xs font-bold text-white/50">Archivada de forma segura</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-black/60 p-4 rounded-2xl border border-white/10 text-center">
                                <p className="text-[10px] font-bold uppercase text-white/40">Tonelaje</p>
                                <p className="text-xl font-black text-cyan-400 tabular-nums mt-1">
                                    {todaySummary.tonnage > 0 ? `${todaySummary.tonnage.toLocaleString()} kg` : '—'}
                                </p>
                            </div>
                            <div className="bg-black/60 p-4 rounded-2xl border border-white/10 text-center">
                                <p className="text-[10px] font-bold uppercase text-white/40">Series</p>
                                <p className="text-xl font-black text-white tabular-nums mt-1">
                                    {todaySummary.sets || '—'}
                                </p>
                            </div>
                            <div className="bg-black/60 p-4 rounded-2xl border border-white/10 text-center">
                                <p className="text-[10px] font-bold uppercase text-white/40">Esfuerzo</p>
                                <p className="text-xl font-black text-red-400 tabular-nums mt-1">
                                    {todaySummary.rpe ? `RPE ${todaySummary.rpe}` : 'Óptimo'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-white/75 leading-relaxed">
                            <strong className="text-white block mb-1">🛡️ Protección Biomecánica & Metodología Lic. Jorge González</strong>
                            Tu rutina de hoy ya quedó registrada y cerrada para evitar fatiga o acumulación externa de protocolos. Mañana se desbloqueará tu siguiente sesión.
                        </div>
                    </div>
                 ) : isWorkoutEmpty ? (
                    /* DÍA DE DESCANSO (SIN "CARGAR SESIÓN MANUAL" QUE FILTRABA RUTINAS) */
                    <div className="bg-[#0F0F11] border border-white/10 rounded-3xl p-8 text-center space-y-5">
                        <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-widest text-cyan-400">Recuperación Programada</p>
                            <h2 className="text-3xl font-black uppercase italic tracking-tight text-white">Hoy no tienes rutina asignada</h2>
                            <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                                Aprovecha para descansar, hidratarte y recuperar tu sistema nervioso. Si estás de viaje o quieres entrenar hoy, pídele tu sesión al Coach Jorge o Leslie.
                            </p>
                        </div>
                        <a 
                          href={coachWhatsApp} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white hover:text-black text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                        >
                          Solicitar Sesión de Hoy al Coach 📲
                        </a>
                    </div>
                 ) : (
                    /* TARJETA ESTILO SMART FIT: "ESTO HARÁS HOY" CON LISTA DE EJERCICIOS */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        <div className="lg:col-span-5 bg-gradient-to-br from-[#141418] to-[#0A0A0D] border border-white/15 rounded-3xl p-6 md:p-8 space-y-6">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-red-500 mb-1">Esto harás hoy</p>
                                <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-white leading-tight">
                                    {currentWorkout.publicTitle || currentWorkout.name}
                                </h2>
                                <p className="text-xs text-white/50 mt-2">
                                  {workoutStats.exCount} ejercicios · {workoutStats.totalSets} series totales · ~{workoutStats.estMinutes} min
                                </p>
                            </div>

                            <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-1">
                                <p className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">
                                    🔒 Propiedad Intelectual Kinetix Functional Zone
                                </p>
                                <p className="text-[11px] text-white/70 font-medium">
                                    Metodología Exclusiva <strong className="text-white">Lic. Jorge González</strong> · Uso exclusivo para {user.name}.
                                </p>
                            </div>

                            <button 
                                onClick={() => onStartSession(currentWorkout)}
                                className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_10px_30px_rgba(220,38,38,0.35)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 min-h-[52px]"
                            >
                                <span>▶</span> Comenzar Entrenamiento de Hoy
                            </button>
                        </div>

                        {/* VISTA PREVIA CLARA DE LOS EJERCICIOS DE HOY */}
                        <div className="lg:col-span-7 bg-[#0F0F11] border border-white/10 rounded-3xl p-6 space-y-4">
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                                <h3 className="text-sm font-black uppercase tracking-wider text-white">Plan de Ejercicios ({currentWorkout.exercises.length})</h3>
                                <span className="text-[11px] text-white/40 font-semibold">Toca "Comenzar" para registrar pesos</span>
                            </div>

                            <div className="divide-y divide-white/10">
                                {currentWorkout.exercises.map((ex, idx) => (
                                    <div key={idx} className="py-3.5 flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3.5 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white/80 shrink-0 tabular-nums">
                                                {String(idx + 1).padStart(2, '0')}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black uppercase italic text-white truncate">
                                                    {ex.name}
                                                    {ex.pair ? ` + ${ex.pair.name}` : ''}
                                                    {ex.supersetChain && ex.supersetChain.length > 0 ? ` (+${ex.supersetChain.length})` : ''}
                                                </p>
                                                <p className="text-xs text-white/60 mt-0.5 tabular-nums">
                                                    {ex.targetSets} series × {ex.targetReps} reps
                                                    {ex.targetRest ? ` · Descanso ${ex.targetRest}s` : ''}
                                                    {ex.method && ex.method !== 'standard' ? ` · ${METHOD_LABEL[ex.method] || ex.method}` : ''}
                                                </p>
                                                {ex.coachCue && (
                                                    <p className="text-[11px] text-cyan-300/80 mt-1 line-clamp-1">
                                                        Indicación: {ex.coachCue}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold text-white/40 shrink-0">
                                            {ex.videoUrl ? '🎥 Video' : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                 )}

                 {/* ASISTENTE BIOMECÁNICO */}
                 {systemConfig.enableAI && user.isActive && (
                     <button onClick={() => setShowChat(true)} className="w-full bg-[#0F0F11] border border-white/10 hover:border-cyan-500/40 p-5 rounded-3xl flex items-center justify-between transition-all">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-11 h-11 bg-cyan-500/15 rounded-2xl flex items-center justify-center text-lg">💡</div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-white">¿Dudas con algún ejercicio?</p>
                                <p className="text-[11px] text-white/50">Consulta postura y técnica en tiempo real</p>
                            </div>
                        </div>
                        <span className="text-cyan-400 font-black text-xs uppercase tracking-wider">Abrir →</span>
                     </button>
                 )}

                 {/* SELLO VISIBLEMENTE LEGIBLE DE PROPIEDAD INTELECTUAL */}
                 <footer className="bg-[#0A0A0D] border border-white/10 rounded-2xl p-4 text-center space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-wider text-white/80">
                       🔒 Propiedad Intelectual Kinetix Functional Zone • Lic. Jorge González
                    </p>
                    <p className="text-[10px] text-white/50">
                       Metodología Exclusiva Lic. Jorge González · Asignado a {user.name} · Prohibida su copia o difusión
                    </p>
                 </footer>
             </div>
         )}

         {activeTab === 'progress' && <ProgressDashboard />}
         
         {activeTab === 'profile' && (
             <div className="space-y-6 animate-in fade-in max-w-2xl mx-auto">
                 <div className="bg-[#0F0F11] border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-5">
                     <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-black border-2 border-white/20 flex items-center justify-center text-3xl font-black text-white shrink-0">
                       {user.name.charAt(0)}
                     </div>
                     <div className="text-center sm:text-left">
                       <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">{user.name}</h2>
                       <p className="text-xs text-white/60 mt-0.5">{user.level} · {user.goal} · {user.email}</p>
                     </div>
                 </div>

                 {/* PREFERENCIA DE UNIDADES Y APP EXTERNA DE MEDIDAS */}
                 <div className="bg-[#0F0F11] border border-white/10 rounded-3xl p-6 space-y-4">
                   <div className="flex justify-between items-center">
                     <div>
                       <h3 className="text-sm font-black uppercase tracking-wider text-white">Unidad de Peso Preferida</h3>
                       <p className="text-xs text-white/50">Se usará como referencia en tus rutinas</p>
                     </div>
                     <div className="flex bg-black p-1 rounded-xl border border-white/10">
                       <button onClick={() => togglePreferredUnit('kg')} className={`px-4 py-2 rounded-lg text-xs font-black ${unitPref === 'kg' ? 'bg-red-600 text-white' : 'text-white/50'}`}>KG</button>
                       <button onClick={() => togglePreferredUnit('lbs')} className={`px-4 py-2 rounded-lg text-xs font-black ${unitPref === 'lbs' ? 'bg-cyan-500 text-black' : 'text-white/50'}`}>LBS</button>
                     </div>
                   </div>

                   <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                     <div>
                       <h4 className="text-xs font-black uppercase text-cyan-400">Medidas Corporales, Peso & RM</h4>
                       <p className="text-xs text-white/50">Consulta tu evolución física completa en Kinetix Progress</p>
                     </div>
                     <a 
                       href="https://kinetix-progress.vercel.app/" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/30 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap"
                     >
                       Ir a Kinetix Progress ↗
                     </a>
                   </div>
                 </div>

                 {/* RÉCORDS PERSONALES DETECTADOS */}
                 <div className="bg-[#0F0F11] border border-white/10 rounded-3xl p-6 space-y-4">
                   <h3 className="text-sm font-black uppercase tracking-wider text-white">Tus Récords Personales (PR)</h3>
                   <div className="space-y-2">
                     {prsList.length > 0 ? (
                       prsList.map((pr, idx) => (
                         <div key={idx} className="bg-black/50 border border-white/10 p-3.5 rounded-2xl flex justify-between items-center">
                           <div>
                             <p className="text-xs font-black uppercase italic text-white">{pr.exerciseName}</p>
                             <p className="text-[11px] text-white/50 tabular-nums">{pr.weight} kg × {pr.reps} reps · {pr.date}</p>
                           </div>
                           <div className="text-right">
                             <span className="text-[10px] text-red-400 font-bold uppercase block">1RM Est.</span>
                             <span className="text-base font-black text-white tabular-nums">{pr.estimated1RM} kg</span>
                           </div>
                         </div>
                       ))
                     ) : (
                       <p className="py-4 text-center text-white/40 text-xs">Tus PRs se calculan automáticamente al registrar tus series.</p>
                     )}
                   </div>
                 </div>

                 <div className="bg-[#0F0F11] border border-white/10 rounded-3xl p-6 space-y-3">
                    <a href={coachWhatsApp} target="_blank" rel="noreferrer" className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors">
                        Contactar a mi Coach 📲
                    </a>
                    <button onClick={onLogout} className="w-full py-4 bg-red-600/15 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors">
                      Cerrar Sesión
                    </button>
                 </div>
             </div>
         )}
      </main>

      {/* BOTTOM TAB BAR CON ETIQUETAS CLARAS (ESTILO SMART FIT) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0D]/95 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-md mx-auto grid grid-cols-3 h-16 items-center">
          <button 
            onClick={() => setActiveTab('train')} 
            className={`flex flex-col items-center justify-center gap-1 h-full transition-colors ${activeTab === 'train' ? 'text-red-500' : 'text-white/50 hover:text-white'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3L4 14h7v7l9-11h-7z"/></svg>
            <span className="text-[11px] font-bold">Entrenar</span>
          </button>
          <button 
            onClick={() => setActiveTab('progress')} 
            className={`flex flex-col items-center justify-center gap-1 h-full transition-colors ${activeTab === 'progress' ? 'text-cyan-400' : 'text-white/50 hover:text-white'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
            <span className="text-[11px] font-bold">Progreso</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex flex-col items-center justify-center gap-1 h-full transition-colors ${activeTab === 'profile' ? 'text-white' : 'text-white/50 hover:text-white'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            <span className="text-[11px] font-bold">Perfil</span>
          </button>
        </div>
      </nav>
      {showChat && <TechnicalChatModal onClose={() => setShowChat(false)} />}
    </div>
  );
};
