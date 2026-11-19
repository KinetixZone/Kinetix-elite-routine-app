import React, { useState, useMemo, useEffect } from 'react';
import { User, Workout, PRRecord } from '../../types/kinetix';
import { ProgressDashboard } from '../analytics/ProgressDashboard';
import { calendarService } from '../../services/calendarService';
import { storageService } from '../../services/storageService';
import { EXERCISES_DB } from '../../constants/exercises';
import { PWAInstallButton } from '../ui/PWAInstallButton';

interface Props {
  user: User;
  currentWorkout: Workout;
  availableWorkouts: Workout[];
  onStartSession: (workout: Workout) => void;
  onLogout: () => void;
  onUserUpdate?: (u: User) => void;
}

const getWorkoutMuscleFocus = (workout?: Workout, loggedExerciseIds?: string[]): string => {
  const catalog = [...EXERCISES_DB, ...storageService.getExercises()];
  const groups: string[] = [];

  if (workout && workout.exercises && workout.exercises.length > 0) {
    workout.exercises.forEach(ex => {
      const match = catalog.find(c => c.id === ex.exerciseId || c.name.toLowerCase() === ex.name.toLowerCase());
      if (match?.muscleGroup) groups.push(match.muscleGroup);
      else if (ex.name) groups.push(ex.name);
    });
  } else if (loggedExerciseIds && loggedExerciseIds.length > 0) {
    loggedExerciseIds.forEach(id => {
      const match = catalog.find(c => c.id === id);
      if (match?.muscleGroup) groups.push(match.muscleGroup);
    });
  }

  const text = `${workout?.category || ''} ${groups.join(' ')}`.toLowerCase();
  const hasLeg = /pierna|cuádricep|cuadricep|isquio|femoral|glúteo|gluteo|pantorrilla|sentadilla|zancada|prensa|hip thrust|peso muerto/.test(text);
  const hasPush = /pecho|pectoral|hombro|deltoide|tríceps|tricep|press|empuje|lagartija|elevación/.test(text);
  const hasPull = /espalda|dorsal|bíceps|bicep|remo|jalón|dominada|tracción|curl/.test(text);
  const hasArm = /bíceps|bicep|tríceps|tricep|brazo|antebrazo|curl|copa|extensión/.test(text);
  const hasCore = /core|abdomen|abdominal|plancha|crunch/.test(text);
  const hasCardio = /hiit|cardio|metabólico|metabolico|burpee|sprint|remoerg/.test(text);

  if (hasLeg && (hasPush || hasPull)) return 'Cuerpo Completo (Full Body)';
  if (hasLeg) return 'Pierna y Glúteo';
  if (hasArm && !hasPush && !hasPull) return 'Brazo';
  if (hasPush && hasPull) return 'Brazo y Torso Superior';
  if (hasPush) return hasArm ? 'Pecho, Hombro y Brazo' : 'Pecho y Hombro';
  if (hasPull) return hasArm ? 'Espalda y Brazo' : 'Espalda y Tracción';
  if (hasCore && !hasCardio) return 'Core y Abdomen';
  if (hasCardio) return 'Acondicionamiento / HIIT';
  return 'Fuerza Funcional';
};

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

export const AthleteHome: React.FC<Props> = ({ user, currentWorkout, onStartSession, onLogout, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState<'train' | 'progress' | 'profile'>('train');
  const [tabHistory, setTabHistory] = useState<Array<'train' | 'progress' | 'profile'>>([]);
  const [tabForward, setTabForward] = useState<Array<'train' | 'progress' | 'profile'>>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [prsList] = useState<PRRecord[]>(() => storageService.getPRs());
  const [unitPref, setUnitPref] = useState<'kg' | 'lbs'>(user.preferredUnit || 'kg');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isSavingPwd, setIsSavingPwd] = useState(false);
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [branding, setBranding] = useState(() => storageService.getBranding());

  useEffect(() => {
    void storageService.syncBrandingFromCloud().then(setBranding);
  }, []);

  const daysUntilCycleEnd = useMemo(() => {
    if (user.role !== 'client' || user.isUnlimited || !user.cycleEndDate || user.isActive === false) return null;
    const todayIso = storageService.getServerTodayIsoSync();
    const endIso = String(user.cycleEndDate).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endIso)) return null;
    const t0 = new Date(`${todayIso}T12:00:00Z`).getTime();
    const t1 = new Date(`${endIso}T12:00:00Z`).getTime();
    return Math.round((t1 - t0) / 86400000);
  }, [user]);

  const goToSpeiTransfer = () => {
    switchTab('profile');
    setTimeout(() => {
      document.getElementById('kinetix-spei-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const switchTab = (next: 'train' | 'progress' | 'profile') => {
    setActiveTab(prev => {
      if (prev === next) return prev;
      setTabHistory(h => [...h.slice(-10), prev]);
      setTabForward([]);
      return next;
    });
  };

  const goTabBack = () => {
    setTabHistory(h => {
      if (h.length === 0) {
        setActiveTab(curr => {
          if (curr !== 'train') {
            setTabForward(f => [curr, ...f]);
            return 'train';
          }
          return curr;
        });
        return h;
      }
      const prev = h[h.length - 1];
      setActiveTab(curr => {
        setTabForward(f => [curr, ...f]);
        return prev;
      });
      return h.slice(0, -1);
    });
  };

  const goTabForward = () => {
    setTabForward(f => {
      if (f.length === 0) return f;
      const next = f[0];
      setActiveTab(curr => {
        setTabHistory(h => [...h.slice(-10), curr]);
        return next;
      });
      return f.slice(1);
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.trim().length < 4) {
      return setPwdMsg({ ok: false, text: 'La contraseña debe tener al menos 4 caracteres.' });
    }
    if (newPwd.trim() !== confirmPwd.trim()) {
      return setPwdMsg({ ok: false, text: 'Las contraseñas no coinciden.' });
    }
    setIsSavingPwd(true);
    const res = await storageService.updateUserPassword(user.id, newPwd.trim());
    setIsSavingPwd(false);
    if (res.ok) {
      const updated = { ...user, password: newPwd.trim() };
      onUserUpdate?.(updated);
      setNewPwd('');
      setConfirmPwd('');
      setPwdMsg({ ok: true, text: '✓ Contraseña actualizada y sincronizada.' });
    } else {
      setPwdMsg({ ok: false, text: res.error || 'No se pudo actualizar.' });
    }
  };

  const coachWhatsApp = "https://wa.me/525627303189";
  const isWorkoutEmpty = !currentWorkout || currentWorkout.id === 'empty-state' || currentWorkout.exercises.length === 0;

  const todaySummary = useMemo(() => {
      const todayStr = storageService.getServerTodayIsoSync();
      const todayLogs = storageService
        .getAllLogs()
        .filter(l =>
          l.timestamp &&
          storageService.getLogServerDateIso(l.timestamp) === todayStr &&
          l.exerciseId !== 'kinetix-session-done' &&
          l.exerciseId !== 'kinetix-session-reopen' &&
          (!l.athleteId || l.athleteId === user.id) &&
          (Number(l.weight) > 0 || Number(l.reps) > 0 || l.exerciseId === 'kinetix-class-log')
        );
      const totalTonnage = todayLogs.reduce((acc, l) => acc + (Number(l.weight || 0) * Number(l.reps || 0)), 0);
      const totalSets = todayLogs.length;
      const rpe = todayLogs.find(l => l.feedback?.rpe)?.feedback?.rpe;
      const muscleFocus = getWorkoutMuscleFocus(
        !isWorkoutEmpty ? currentWorkout : undefined,
        todayLogs.map(l => l.exerciseId)
      );
      return {
          hasLogs: todayLogs.length > 0,
          tonnage: totalTonnage,
          sets: totalSets,
          muscleFocus,
          rpe
      };
  }, [currentWorkout, isWorkoutEmpty, user.id, activeTab]);

  const completionStatus = useMemo(() => {
      if (storageService.isSessionReopenedByCoach(user.id)) return { isDone: false, label: '' };
      if (!isWorkoutEmpty && storageService.isSessionComplete(currentWorkout.id, user.id)) {
        return { isDone: true, label: 'SESIÓN COMPLETADA' };
      }
      if (storageService.isSessionComplete(currentWorkout?.id || '', user.id)) {
        return { isDone: true, label: 'SESIÓN COMPLETADA' };
      }
      if (todaySummary.hasLogs) return { isDone: true, label: 'SESIÓN COMPLETADA' };
      return { isDone: false, label: '' };
  }, [currentWorkout, isWorkoutEmpty, todaySummary.hasLogs, user.id]);

  const workoutStats = useMemo(() => {
      if (isWorkoutEmpty) return { exCount: 0, totalSets: 0, estMinutes: 0 };
      const exCount = currentWorkout.exercises.length;
      const totalSets = currentWorkout.exercises.reduce((acc, ex) => acc + (ex.targetSets || 3), 0);
      const estMinutes = Math.max(25, Math.round(totalSets * 2.4));
      return { exCount, totalSets, estMinutes };
  }, [currentWorkout, isWorkoutEmpty]);

  const weeklyHorizon = useMemo(() => {
    const todayIso = storageService.getServerTodayIsoSync();
    const today = new Date(`${todayIso}T12:00:00`);
    const dayOfWeek = today.getDay();
    const safeOffset = Math.min(0, weekOffset);
    const diffToMon = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + safeOffset * 7;
    const monday = new Date(today.getFullYear(), today.getMonth(), diffToMon);
    const allLogs = storageService.getAllLogs();
    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const isToday = dateStr === todayIso;
        const isFuture = dateStr > todayIso;
        const isPast = dateStr < todayIso;
        // Seguridad estricta: días futuros jamás consultan ni revelan rutinas
        const tplId = (isToday || isPast) ? calendarService.getScheduledSession(d, user.id) : null;
        const tpl = tplId ? storageService.getWorkoutById(tplId) : undefined;
        const dayLogs = !isFuture
          ? allLogs.filter(l =>
              storageService.getLogServerDateIso(l.timestamp) === dateStr &&
              (!l.athleteId || l.athleteId === user.id) &&
              (Number(l.weight) > 0 || Number(l.reps) > 0 || l.exerciseId === 'kinetix-class-log' || l.exerciseId === 'kinetix-session-done')
            )
          : [];
        const hasLogs = isToday
          ? completionStatus.isDone
          : isPast && dayLogs.length > 0;
        const focusLabel = isPast
          ? (tpl ? getWorkoutMuscleFocus(tpl) : dayLogs.length > 0 ? getWorkoutMuscleFocus(undefined, dayLogs.map(l => l.exerciseId)) : '')
          : '';
        week.push({
          dayName: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()],
          dayNum: d.getDate(),
          dateStr,
          isToday,
          isFuture,
          isPast,
          hasSession: isToday ? !!tplId : false,
          isDone: hasLogs,
          focusLabel
        });
    }
    return week;
  }, [user.id, completionStatus.isDone, weekOffset]);

  const togglePreferredUnit = (u: 'kg' | 'lbs') => {
    setUnitPref(u);
    const updatedUser = { ...user, preferredUnit: u };
    storageService.saveUser(updatedUser);
  };

  const forensicStamp = `🔒 KINETIX • LIC. JORGE GONZÁLEZ • ${user.name.toUpperCase()} • ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div 
      className="min-h-screen bg-[#050507] text-white relative overflow-x-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
      {/* MARCA DE AGUA FORENSE VISIBLE ANTICAPTURA */}
      <div className="fixed inset-0 pointer-events-none z-30 opacity-[0.14] overflow-hidden select-none flex flex-col justify-around rotate-[-20deg] scale-125">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className={`whitespace-nowrap text-[10px] font-mono font-black tracking-[0.22em] text-center ${idx % 2 === 0 ? 'text-white' : 'text-red-500'}`}>
            {forensicStamp}
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

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-xs font-bold">
            {activeTab !== 'train' && (
              <button
                type="button"
                onClick={goTabBack}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-black transition-colors"
              >
                ← Regresar
              </button>
            )}
            <PWAInstallButton compact />
            <span className="text-cyan-400 tabular-nums hidden sm:inline">🔥 {user.streak || 0}</span>
            <button 
              onClick={() => switchTab('profile')}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold transition-colors whitespace-nowrap"
            >
              Cuenta
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-black transition-colors whitespace-nowrap"
              title="Cerrar sesión en 1 toque"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-20 max-w-5xl mx-auto pt-6 px-4 md:px-8 pb-28">
         {activeTab !== 'train' && (
           <div className="mb-4 flex items-center justify-between gap-2">
             <button
               type="button"
               onClick={goTabBack}
               className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black uppercase tracking-wider text-white transition-all"
             >
               ← Anterior / Regresar
             </button>
             {tabForward.length > 0 && (
               <button
                 type="button"
                 onClick={goTabForward}
                 className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black uppercase tracking-wider text-white transition-all"
               >
                 Siguiente →
               </button>
             )}
           </div>
         )}
         
         {activeTab === 'train' && (
             <div className="space-y-6 animate-in fade-in">

                 {/* AVISO AUTOMÁTICO 3 DÍAS ANTES DEL CORTE -> TRANSFERENCIA SPEI */}
                 {daysUntilCycleEnd !== null && daysUntilCycleEnd >= 0 && daysUntilCycleEnd <= 3 && (
                   <div className="bg-amber-950/35 border border-amber-500/40 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                     <div className="flex items-center gap-2.5 min-w-0">
                       <span className="text-base shrink-0">⏳</span>
                       <p className="text-xs font-bold text-amber-200 leading-snug">
                         Tu ciclo vence el <strong className="text-white">{user.cycleEndDate}</strong>{' '}
                         <span className="text-amber-300/90">
                           ({daysUntilCycleEnd === 0 ? '¡hoy!' : daysUntilCycleEnd === 1 ? 'mañana' : `en ${daysUntilCycleEnd} días`})
                         </span>
                       </p>
                     </div>
                     <button
                       type="button"
                       onClick={goToSpeiTransfer}
                       className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider transition-all shrink-0"
                     >
                       Ver Transferencia SPEI →
                     </button>
                   </div>
                 )}

                 {/* CINTA SEMANAL INTERACTIVA (Solo historial pasado + Hoy; días futuros 100% bloqueados) */}
                 <section aria-label="Calendario semanal" className="bg-[#0F0F11] border border-white/10 rounded-3xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1 mb-3">
                       <h2 className="text-xs font-black uppercase tracking-wider text-white/70">Tu Semana de Entrenamiento</h2>
                       <div className="flex items-center gap-1.5">
                         <button
                           type="button"
                           onClick={() => { setSelectedDayIdx(null); setWeekOffset(w => w - 1); }}
                           className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] font-black text-white/70 hover:text-white transition-colors"
                         >
                           ← Sem. Anterior
                         </button>
                         {weekOffset < 0 && (
                           <button
                             type="button"
                             onClick={() => { setSelectedDayIdx(null); setWeekOffset(0); }}
                             className="px-2.5 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white text-[10px] font-black transition-colors"
                           >
                             Hoy
                           </button>
                         )}
                         {weekOffset < 0 && (
                           <button
                             type="button"
                             onClick={() => { setSelectedDayIdx(null); setWeekOffset(w => Math.min(0, w + 1)); }}
                             className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] font-black text-white/70 hover:text-white transition-colors"
                           >
                             Siguiente →
                           </button>
                         )}
                       </div>
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
                               <span className={`text-[9px] font-bold ${d.isDone ? 'text-emerald-400' : d.isToday && d.hasSession ? 'text-white' : 'text-white/25'}`}>
                                 {d.isDone ? '✓' : d.isToday && d.hasSession ? 'HOY' : '🔒'}
                               </span>
                             </button>
                           );
                       })}
                    </div>

                    {selectedDayIdx !== null && !weeklyHorizon[selectedDayIdx]?.isToday && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-black/70 border border-white/10 text-xs text-white/80 flex items-center justify-between gap-3">
                        <span>
                          {weeklyHorizon[selectedDayIdx].isDone
                            ? `${weeklyHorizon[selectedDayIdx].dayName} ${weeklyHorizon[selectedDayIdx].dayNum}: Entrenaste ${weeklyHorizon[selectedDayIdx].focusLabel || 'tu sesión'} · Sesión archivada.`
                            : weeklyHorizon[selectedDayIdx].isPast
                            ? `${weeklyHorizon[selectedDayIdx].dayName} ${weeklyHorizon[selectedDayIdx].dayNum}: Día de descanso / sin registro.`
                            : `${weeklyHorizon[selectedDayIdx].dayName} ${weeklyHorizon[selectedDayIdx].dayNum}: 🔒 Día futuro bloqueado · Tu rutina se desbloquea únicamente el día que corresponde entrenar.`}
                        </span>
                        <button onClick={() => setSelectedDayIdx(null)} className="text-white/40 hover:text-white px-2 shrink-0">✕</button>
                      </div>
                    )}
                 </section>

                 {/* BLOQUE PRINCIPAL: ESTO HARÁS HOY */}
                 {user.isActive === false ? (
                    <div className="bg-[#0F0F11] border border-red-600/30 rounded-3xl p-8 text-center space-y-4">
                        <h3 className="text-2xl font-black uppercase italic text-red-500">Membresía Inactiva</h3>
                        <p className="text-xs text-white/60 max-w-md mx-auto">Tu acceso se encuentra pausado. Comunícate con Kinetix Functional Zone para reactivar tu plan.</p>
                        <a href={coachWhatsApp} target="_blank" rel="noreferrer" className="inline-block px-8 py-4 bg-[#25D366] text-white rounded-2xl font-black uppercase tracking-wider text-xs">
                          Contactar al Coach por WhatsApp
                        </a>
                    </div>
                 ) : completionStatus.isDone ? (
                    /* SESIÓN YA TERMINADA HOY (BLOQUEO ANTICOPIA POST-SESIÓN SINCRONIZADO EN TODOS LOS DISPOSITIVOS) */
                    <div className="bg-[#0F0F11] border border-emerald-500/30 rounded-3xl p-6 md:p-8 space-y-6">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-emerald-400">✓ Sesión Completada Hoy</p>
                                <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-white mt-1">
                                    Hoy entrenaste: {todaySummary.muscleFocus}
                                </h2>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs font-bold text-emerald-300">🔒 Cerrada de forma segura</span>
                              <span className="text-[10px] font-bold text-white/45">☁️ Bloqueo sincronizado en la nube</span>
                            </div>
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

                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-white/75 leading-relaxed space-y-1">
                            <strong className="text-white block">🛡️ Protección Metodológica · Lic. Jorge González</strong>
                            <p>Tu rutina de hoy ya quedó registrada y bloqueada para evitar descargas o copias externas. Si cerraste la sesión por error, únicamente tu Coach puede desbloquearla.</p>
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
                                                <p className="text-sm font-black uppercase italic text-white leading-snug break-words">
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
                                                    <p className="text-[11px] text-cyan-300/85 mt-1 leading-relaxed">
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

                 {/* NOTA DEL COACH SINCRONIZADA (LECTURA 0-TOKENS PARA ATLETA) */}
                 {user.isActive !== false && (() => {
                   const coachNote = user.coachNote?.trim() || currentWorkout?.exercises?.find(ex => ex.coachCue?.trim())?.coachCue?.trim();
                   if (!coachNote) return null;
                   return (
                     <section className="bg-[#0F0F11] border border-cyan-500/30 rounded-3xl p-5 flex items-start gap-3.5">
                       <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-lg shrink-0">🎯</div>
                       <div className="min-w-0 space-y-1">
                         <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Nota de tu Coach · Lic. Jorge González</p>
                         <p className="text-xs text-white/90 font-semibold leading-relaxed whitespace-pre-line">{coachNote}</p>
                       </div>
                     </section>
                   );
                 })()}

                 {/* SOPORTE DIRECTO CON COACH (SIN CONSUMO DE TOKENS IA) */}
                 {user.isActive !== false && (
                     <a
                       href={coachWhatsApp}
                       target="_blank"
                       rel="noreferrer"
                       className="w-full bg-[#0F0F11] border border-white/10 hover:border-cyan-500/40 p-5 rounded-3xl flex items-center justify-between transition-all"
                     >
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-11 h-11 bg-emerald-500/15 rounded-2xl flex items-center justify-center text-lg">📲</div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-wider text-white">¿Dudas con algún ejercicio?</p>
                                <p className="text-[11px] text-white/50">Consulta directo con tu Coach por WhatsApp</p>
                            </div>
                        </div>
                        <span className="text-emerald-400 font-black text-xs uppercase tracking-wider">Escribir →</span>
                     </a>
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

         {activeTab === 'progress' && <ProgressDashboard athleteId={user.id} />}
         
         {activeTab === 'profile' && (
             <div className="space-y-6 animate-in fade-in max-w-2xl mx-auto">
                 <div className="bg-[#0F0F11] border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-5">
                     <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-black border-2 border-white/20 flex items-center justify-center text-3xl font-black text-white shrink-0">
                       {user.name.charAt(0)}
                     </div>
                     <div className="text-center sm:text-left">
                       <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">{user.name}</h2>
                       <p className="text-xs text-white/60 mt-0.5">
                         <span className="font-mono text-cyan-400">@{user.username || user.email.split('@')[0]}</span> · {user.level} · {user.goal}
                       </p>
                     </div>
                 </div>

                  {/* SEGURIDAD Y CONTRASEÑA EDITABLE POR EL USUARIO */}
                  <div className="bg-[#0F0F11] border border-white/10 rounded-3xl p-6 space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Acceso y Contraseña</h3>
                        <p className="text-xs text-white/50">
                          Usuario: <span className="font-mono text-cyan-400 font-bold">@{user.username || user.email.split('@')[0]}</span>
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase ${user.isUnlimited ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 text-white/60 border border-white/10'}`}>
                        {user.isUnlimited ? '∞ Acceso Sin Corte' : user.cycleEndDate ? `Vigencia: ${user.cycleEndDate}` : 'Activo'}
                      </span>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-3 pt-2 border-t border-white/10">
                      <p className="text-[11px] font-bold text-white/60">Cambiar mi contraseña personal:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="password"
                          value={newPwd}
                          onChange={e => setNewPwd(e.target.value)}
                          placeholder="Nueva contraseña (mín. 4)"
                          className="w-full bg-black border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-cyan-500"
                        />
                        <input
                          type="password"
                          value={confirmPwd}
                          onChange={e => setConfirmPwd(e.target.value)}
                          placeholder="Confirmar nueva contraseña"
                          className="w-full bg-black border border-white/15 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                      {pwdMsg && (
                        <p className={`text-xs font-bold ${pwdMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                          {pwdMsg.text}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={isSavingPwd || !newPwd.trim()}
                        className="px-5 py-2.5 bg-white text-black hover:bg-cyan-400 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40"
                      >
                        {isSavingPwd ? 'Guardando...' : 'Actualizar Contraseña'}
                      </button>
                    </form>
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

                 {/* DATOS PARA TRANSFERENCIA BANCARIA (SPEI / RENOVACIÓN) */}
                 <div id="kinetix-spei-card" className="bg-[#0F0F11] border border-cyan-500/25 rounded-3xl p-6 space-y-4">
                   <div className="flex flex-wrap justify-between items-center gap-2">
                     <div>
                       <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Renovación / Mensualidad</span>
                       <h3 className="text-sm font-black uppercase tracking-wider text-white">🏦 Información para Transferencia (SPEI)</h3>
                     </div>
                     {user.cycleEndDate && !user.isUnlimited && (
                       <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/70">
                         Corte: {user.cycleEndDate}
                       </span>
                     )}
                   </div>

                   {(branding.bankClabe || branding.bankAccount || branding.bankName) ? (
                     <div className="space-y-3">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/60 border border-white/10 rounded-2xl p-4 text-xs">
                         {branding.bankName && (
                           <div>
                             <span className="text-[9px] font-black uppercase text-white/40 block">Banco</span>
                             <span className="font-bold text-white">{branding.bankName}</span>
                           </div>
                         )}
                         {branding.bankHolder && (
                           <div>
                             <span className="text-[9px] font-black uppercase text-white/40 block">Titular / Beneficiario</span>
                             <span className="font-bold text-white">{branding.bankHolder}</span>
                           </div>
                         )}
                         {branding.bankClabe && (
                           <div className="sm:col-span-2">
                             <span className="text-[9px] font-black uppercase text-white/40 block">CLABE Interbancaria</span>
                             <span className="font-mono font-black text-cyan-300 tracking-wider select-all break-all">{branding.bankClabe}</span>
                           </div>
                         )}
                         {branding.bankAccount && (
                           <div className="sm:col-span-2">
                             <span className="text-[9px] font-black uppercase text-white/40 block">Número de Cuenta / Tarjeta</span>
                             <span className="font-mono font-bold text-white select-all break-all">{branding.bankAccount}</span>
                           </div>
                         )}
                         <div className="sm:col-span-2 pt-2 border-t border-white/10">
                           <span className="text-[9px] font-black uppercase text-white/40 block">Concepto Recomendado</span>
                           <span className="text-white/80 font-semibold">
                             {user.name} · {branding.bankConceptNote || 'Mensualidad Kinetix'}
                           </span>
                         </div>
                       </div>

                       <div className="flex flex-col sm:flex-row gap-2.5">
                         {(branding.bankClabe || branding.bankAccount) && (
                           <button
                             type="button"
                             onClick={() => {
                               const val = (branding.bankClabe || branding.bankAccount || '').trim();
                               if (!val) return;
                               navigator.clipboard.writeText(val);
                               setCopiedClabe(true);
                               setTimeout(() => setCopiedClabe(false), 2500);
                             }}
                             className="flex-1 py-3 bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                           >
                             {copiedClabe ? '✓ Copiado al Portapapeles' : branding.bankClabe ? '📋 Copiar CLABE' : '📋 Copiar Cuenta'}
                           </button>
                         )}
                         <a
                           href={`https://wa.me/${(branding.whatsappReceipts || '525627303189').replace(/\D/g, '')}?text=${encodeURIComponent(`Hola 👋 Soy ${user.name} (@${user.username || user.email.split('@')[0]}). Envío mi comprobante de transferencia para renovar mi acceso en Kinetix.`)}`}
                           target="_blank"
                           rel="noreferrer"
                           className="flex-1 py-3 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-black uppercase tracking-wider text-center transition-all"
                         >
                           📲 Enviar Comprobante
                         </a>
                       </div>
                     </div>
                   ) : (
                     <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                       <p className="text-xs text-white/60">
                         Solicita la CLABE actualizada para tu transferencia directo por WhatsApp.
                       </p>
                       <a
                         href={`https://wa.me/${(branding.whatsappReceipts || '525627303189').replace(/\D/g, '')}?text=${encodeURIComponent(`Hola 👋 Soy ${user.name}, ¿me compartes los datos para transferencia de mi mensualidad Kinetix?`)}`}
                         target="_blank"
                         rel="noreferrer"
                         className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all"
                       >
                         Pedir CLABE 📲
                       </a>
                     </div>
                   )}
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
                    <PWAInstallButton />
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
            onClick={() => switchTab('train')} 
            className={`flex flex-col items-center justify-center gap-1 h-full transition-colors ${activeTab === 'train' ? 'text-red-500' : 'text-white/50 hover:text-white'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3L4 14h7v7l9-11h-7z"/></svg>
            <span className="text-[11px] font-bold">Entrenar</span>
          </button>
          <button 
            onClick={() => switchTab('progress')} 
            className={`flex flex-col items-center justify-center gap-1 h-full transition-colors ${activeTab === 'progress' ? 'text-cyan-400' : 'text-white/50 hover:text-white'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
            <span className="text-[11px] font-bold">Progreso</span>
          </button>
          <button 
            onClick={() => switchTab('profile')} 
            className={`flex flex-col items-center justify-center gap-1 h-full transition-colors ${activeTab === 'profile' ? 'text-white' : 'text-white/50 hover:text-white'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            <span className="text-[11px] font-bold">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
