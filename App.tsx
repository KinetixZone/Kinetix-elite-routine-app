
import React, { useState, useEffect, useCallback } from 'react';
import { Workout, User, ProgressState } from './types/kinetix';
import { LiveTracker } from './components/workout/LiveTracker';
import { AthleteHome } from './components/player/AthleteHome';
import { CoachHome } from './components/coach/CoachHome'; 
import { AthleteCRM } from './components/coach/AthleteCRM'; 
import { ExerciseLibrary } from './components/admin/ExerciseLibrary';
import { WorkoutManager } from './components/coach/WorkoutManager';
import { AdminDashboard } from './components/admin/AdminDashboard'; 
import { AuthScreen } from './components/auth/AuthScreen';
import { UnitConverterModal } from './components/ui/UnitConverterModal';
import { calendarService } from './services/calendarService';
import { storageService } from './services/storageService';

const EMPTY_WORKOUT: Workout = {
  id: 'empty-state',
  name: 'Descanso Total',
  day: 0,
  exercises: [] 
};

const DEFAULT_WORKOUT: Workout = {
  id: 'workout-1',
  name: 'Kinetix Elite Demo',
  day: 1,
  exercises: [
    {
      exerciseId: 'hal-01',
      name: 'Clean & Jerk',
      targetSets: 3,
      targetReps: '3',
      method: 'ahap',
      targetRest: 90,
      videoUrl: 'https://www.youtube.com/embed/J2YH8S6-Pss'
    }
  ]
};

type AppView = 'home' | 'manager' | 'tracker' | 'crm' | 'library' | 'athlete_home' | 'admin_dashboard';

const VIEW_LABELS: Record<AppView, string> = {
  home: 'Dashboard',
  crm: 'Atletas',
  manager: 'Rutinas',
  library: 'Ejercicios',
  tracker: 'Sesión en Vivo',
  admin_dashboard: 'Sistema Core',
  athlete_home: 'Atleta'
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>('athlete_home');
  const [navHistory, setNavHistory] = useState<AppView[]>([]);
  const [forwardHistory, setForwardHistory] = useState<AppView[]>([]);
  const [currentWorkout, setCurrentWorkout] = useState<Workout>(EMPTY_WORKOUT);
  const [availableTemplates, setAvailableTemplates] = useState<Workout[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [showUnitConverter, setShowUnitConverter] = useState(false);

  const navigateTo = useCallback((nextView: AppView) => {
    setView(prev => {
      if (prev === nextView) return prev;
      setNavHistory(h => [...h.slice(-15), prev]);
      setForwardHistory([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return nextView;
    });
  }, []);

  const goBack = useCallback(() => {
    setNavHistory(h => {
      if (h.length === 0) {
        setView(curr => {
          if (curr !== 'home') {
            setForwardHistory(f => [curr, ...f.slice(0, 14)]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return 'home';
          }
          return curr;
        });
        return h;
      }
      const prev = h[h.length - 1];
      setView(curr => {
        setForwardHistory(f => [curr, ...f.slice(0, 14)]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return prev;
      });
      return h.slice(0, -1);
    });
  }, []);

  const goForward = useCallback(() => {
    setForwardHistory(f => {
      if (f.length === 0) return f;
      const next = f[0];
      setView(curr => {
        setNavHistory(h => [...h.slice(-15), curr]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return next;
      });
      return f.slice(1);
    });
  }, []);

  useEffect(() => {
    const initApp = async () => {
        storageService.init(DEFAULT_WORKOUT);
        const serverTodayIso = await storageService.fetchServerTodayIso();
        const localUser = storageService.getUser();
        if (localUser) {
            if (localUser.role !== 'owner') {
                const syncedList = await storageService.syncAthletesFromCloud();
                const fresh = syncedList.find(u => u.id === localUser.id);
                if (fresh) {
                    const expired = storageService.isMembershipExpired(fresh, serverTodayIso);
                    if (fresh.isActive === false || expired) {
                        storageService.logout();
                        setIsLoading(false);
                        return;
                    }
                    storageService.saveUser(fresh);
                    setUser(fresh);
                    setView(fresh.role === 'client' ? 'athlete_home' : 'home');
                    setIsLoading(false);
                    return;
                }
                if (localUser.isActive === false || storageService.isMembershipExpired(localUser, serverTodayIso)) {
                    storageService.logout();
                    setIsLoading(false);
                    return;
                }
            }
            setUser(localUser);
            if (localUser.role === 'client') setView('athlete_home');
            else setView('home');
        }
        setIsLoading(false);
    };
    initApp();
  }, []);

  const refreshWorkoutContext = useCallback(async () => {
    if (!user) return;
    const athleteScope = user.role === 'client' ? user.id : undefined;
    const serverTodayIso = await storageService.fetchServerTodayIso();

    const applyScheduledWorkout = async (sourceTemplates: Workout[]) => {
      const today = new Date(`${serverTodayIso}T12:00:00`);
      const scheduledWorkoutId = calendarService.getScheduledSession(today, user.id);
      if (scheduledWorkoutId) {
        const scheduledWorkout =
          sourceTemplates.find(t => t.id === scheduledWorkoutId) ||
          storageService.getWorkoutById(scheduledWorkoutId) ||
          (await storageService.getTemplateByIdCloud(scheduledWorkoutId));
        const isFutureRoutine =
          user.role === 'client' &&
          scheduledWorkout?.scheduledDate &&
          String(scheduledWorkout.scheduledDate).slice(0, 10) > serverTodayIso;
        if (scheduledWorkout && !isFutureRoutine) {
          setCurrentWorkout(scheduledWorkout);
          return;
        }
      }
      setCurrentWorkout(EMPTY_WORKOUT);
    };

    const [templates] = await Promise.all([
      storageService.getTemplates(athleteScope, {
        onRevalidate: (fresh) => {
          setAvailableTemplates(fresh);
          void applyScheduledWorkout(fresh);
        }
      }),
      calendarService.syncCalendarFromCloud(athleteScope),
      storageService.syncLogsFromCloud(athleteScope),
      storageService.syncAthletesFromCloud()
    ]);
    setAvailableTemplates(templates);
    await applyScheduledWorkout(templates);
  }, [user]);

  useEffect(() => {
    if (user && (view === 'athlete_home' || view === 'home')) {
        refreshWorkoutContext();
    }
  }, [user, view, refreshWorkoutContext]);

  const handleLoginSuccess = (newUser: User) => {
      setUser(newUser);
      setNavHistory([]);
      setForwardHistory([]);
      if (newUser.role === 'client') setView('athlete_home');
      else setView('home');
  };

  const handleLogout = () => {
      storageService.logout();
      setUser(null);
      setNavHistory([]);
      setForwardHistory([]);
      setCurrentWorkout(EMPTY_WORKOUT);
      setView('athlete_home');
  };

  const handleStartSession = (workout: Workout) => {
      if (user?.role === 'client') {
        const serverTodayIso = storageService.getServerTodayIsoSync();
        const isFutureRoutine =
          workout.scheduledDate && String(workout.scheduledDate).slice(0, 10) > serverTodayIso;
        if (isFutureRoutine || storageService.isSessionComplete(workout.id, user.id)) {
          void refreshWorkoutContext();
          return;
        }
      }
      setCurrentWorkout(workout);
      setView('tracker');
  };

  const handleFinishWorkout = async (progress: ProgressState) => {
    const enrichedLogs = progress.workoutLogs.map(log => ({
      ...log,
      athleteId: log.athleteId || user?.id,
      workoutId: log.workoutId || currentWorkout.id,
      workoutName: log.workoutName || currentWorkout.publicTitle || currentWorkout.name
    }));
    await storageService.saveSessionLogs(enrichedLogs);
    await storageService.markSessionComplete(currentWorkout.id, user?.id);
    await refreshWorkoutContext();
    setView(user?.role === 'client' ? 'athlete_home' : 'home');
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center text-white font-black overflow-hidden">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-red-600 blur-[60px] opacity-20 animate-pulse"></div>
            <div className="relative text-7xl md:text-8xl italic tracking-tighter">K</div>
        </div>
        <div className="flex flex-col items-center gap-2">
            <div className="h-[2px] w-24 bg-red-600 animate-[loading_1.5s_ease-in-out_infinite]"></div>
            <p className="text-[10px] uppercase tracking-[0.8em] text-white/40 animate-pulse mt-4">Cargando Obsidian Elite OS</p>
        </div>
        <style>{`
            @keyframes loading {
                0% { transform: scaleX(0); opacity: 0; }
                50% { transform: scaleX(1); opacity: 1; }
                100% { transform: scaleX(0); opacity: 0; }
            }
        `}</style>
    </div>
  );

  if (!user) return <AuthScreen onLoginSuccess={handleLoginSuccess} />;

  if (user.role === 'client') {
      return (
        <div className="min-h-screen bg-[#050507] text-white">
            {view === 'tracker' ? (
                <LiveTracker workout={currentWorkout} user={user} onFinish={handleFinishWorkout} onExit={() => setView('athlete_home')} />
            ) : (
                <AthleteHome 
                    user={user} 
                    currentWorkout={currentWorkout} 
                    availableWorkouts={availableTemplates}
                    onStartSession={handleStartSession}
                    onLogout={handleLogout}
                    onUserUpdate={setUser}
                />
            )}
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white pb-24 md:pb-28">
        {/* Barra Superior de Identidad de Coach / Dueño (Legible y responsiva en móvil y compu) */}
        <header className="sticky top-0 z-[400] bg-[#050507]/95 backdrop-blur-xl border-b border-white/10 px-3 md:px-6 py-2.5 space-y-2 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
            <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-9 h-9 rounded-xl bg-black border border-cyan-500/40 p-0.5 overflow-hidden shadow-[0_0_12px_rgba(0,240,255,0.25)] flex items-center justify-center shrink-0">
                        <img 
                            src="/assets/aistudio/1759185151992_02f8a860.jpg" 
                            alt="Kinetix Logo" 
                            className="w-full h-full object-cover rounded-lg"
                        />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black uppercase text-white tracking-wider leading-tight">
                                {user.name.toLowerCase().includes('leslie') ? '👑 Leslie Barrera' : user.name.toLowerCase().includes('jorge') ? '👑 Jorge González' : user.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/40 shrink-0">
                                {user.name.toLowerCase().includes('jorge') ? 'HEAD COACH & DUEÑO' : user.name.toLowerCase().includes('leslie') ? 'DUEÑA & COACH' : 'COACH'}
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider leading-tight mt-0.5">
                            <span className="text-cyan-400 font-black">Kinetix</span> · {VIEW_LABELS[view]}
                        </p>
                    </div>
                </div>

                {/* Botón Salir siempre visible en la esquina derecha en móvil */}
                <button 
                    onClick={handleLogout} 
                    className="lg:hidden px-3 py-2 rounded-xl bg-white/5 hover:bg-red-950/60 text-white/75 hover:text-red-400 text-[10px] font-black uppercase tracking-wider border border-white/10 transition-all shrink-0"
                    title="Cerrar Sesión"
                >
                    Salir
                </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-start lg:justify-end">
                {/* Navegación Global Anterior / Siguiente para Coach y Dueños */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-0.5">
                    <button
                        type="button"
                        onClick={goBack}
                        disabled={navHistory.length === 0 && view === 'home'}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-white/90 hover:bg-white/15 disabled:opacity-25 transition-all"
                        title="Regresar a la vista anterior"
                    >
                        ← Regresar
                    </button>
                    <button
                        type="button"
                        onClick={goForward}
                        disabled={forwardHistory.length === 0}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider text-white/90 hover:bg-white/15 disabled:opacity-25 transition-all"
                        title="Ir a la vista siguiente"
                    >
                        Siguiente →
                    </button>
                </div>

                {/* Enlace a App de Control de Pagos (EXCLUSIVO DUEÑOS: LESLIE & JORGE) */}
                {user.role === 'owner' && (
                    <a 
                        href="https://kinetix-control.vercel.app/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-600 text-cyan-300 hover:text-white text-[10px] font-black uppercase tracking-wider border border-cyan-500/30 transition-all"
                        title="Control de Pagos & Membresías (Solo Dueños)"
                    >
                        <span>💳</span> <span>Pagos</span>
                    </a>
                )}

                {/* Enlace a App de Cargas, RM & Peso */}
                <a 
                    href="https://kinetix-progress.vercel.app/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-600 text-red-300 hover:text-white text-[10px] font-black uppercase tracking-wider border border-red-500/30 transition-all"
                    title="Seguimiento de Cargas & RM (kinetix-progress.vercel.app)"
                >
                    <span>📈</span> <span>RM</span>
                </a>

                {/* Calculadora de Unidades KG ⇄ LBS */}
                <button 
                    onClick={() => setShowUnitConverter(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black text-[10px] font-black uppercase tracking-wider border border-white/20 transition-all"
                    title="Convertir Kilogramos y Libras"
                >
                    <span>⚖️</span> <span>KG⇄LBS</span>
                </button>

                <button 
                    onClick={handleLogout} 
                    className="hidden lg:inline-flex px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-950/60 text-white/70 hover:text-red-400 text-[10px] font-black uppercase tracking-wider border border-white/10 transition-all"
                    title="Cerrar Sesión"
                >
                    Salir
                </button>
            </div>
        </header>

        <nav className="fixed bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-xl bg-[#0F0F11]/95 backdrop-blur-3xl border border-white/15 px-2 sm:px-5 py-2.5 md:py-3.5 rounded-3xl flex items-center justify-around gap-1 z-[500] shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
            <button onClick={() => navigateTo('home')} className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-2xl transition-all ${view === 'home' ? 'text-red-500 bg-red-500/10' : 'text-white/55 hover:text-white'}`}>
                <span className="text-base md:text-xl">📊</span>
                <span className="text-[9px] font-black uppercase tracking-wide">Inicio</span>
            </button>
            <button onClick={() => navigateTo('crm')} className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-2xl transition-all ${view === 'crm' ? 'text-red-500 bg-red-500/10' : 'text-white/55 hover:text-white'}`}>
                <span className="text-base md:text-xl">👥</span>
                <span className="text-[9px] font-black uppercase tracking-wide">Atletas</span>
            </button>
            <button onClick={() => navigateTo('manager')} className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-2xl transition-all ${view === 'manager' ? 'text-red-500 bg-red-500/10' : 'text-white/55 hover:text-white'}`}>
                <span className="text-base md:text-xl">📐</span>
                <span className="text-[9px] font-black uppercase tracking-wide">Rutinas</span>
            </button>
            <button onClick={() => navigateTo('library')} className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-2xl transition-all ${view === 'library' ? 'text-cyan-400 bg-cyan-500/10' : 'text-white/55 hover:text-white'}`}>
                <span className="text-base md:text-xl">📚</span>
                <span className="text-[9px] font-black uppercase tracking-wide">Ejercicios</span>
            </button>
            {(user.role === 'admin' || user.role === 'owner') && (
                <button onClick={() => navigateTo('admin_dashboard')} className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-2xl transition-all ${view === 'admin_dashboard' ? 'text-blue-400 bg-blue-500/10' : 'text-white/55 hover:text-white'}`}>
                    <span className="text-base md:text-xl">⚙️</span>
                    <span className="text-[9px] font-black uppercase tracking-wide">Sistema</span>
                </button>
            )}
        </nav>

        <main className="animate-in fade-in duration-500">
            {view === 'tracker' && <LiveTracker workout={currentWorkout} user={user} onFinish={handleFinishWorkout} onExit={goBack} />}
            {view === 'home' && <CoachHome onViewChange={navigateTo} currentUser={user} />}
            {view === 'crm' && <AthleteCRM onSwitchUser={refreshWorkoutContext} currentUser={user} />}
            {view === 'library' && <ExerciseLibrary onBack={goBack} />}
            {view === 'manager' && <WorkoutManager />}
            {view === 'admin_dashboard' && <AdminDashboard currentUser={user} onNavigate={navigateTo} />}
        </main>

        {/* Modal Convertidor de Unidades KG ⇄ LBS */}
        <UnitConverterModal isOpen={showUnitConverter} onClose={() => setShowUnitConverter(false)} />
    </div>
  );
};

export default App;
