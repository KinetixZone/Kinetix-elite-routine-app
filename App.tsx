
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
      exerciseId: 'hal-1',
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
      return nextView;
    });
  }, []);

  const goBack = useCallback(() => {
    setNavHistory(h => {
      if (h.length === 0) {
        setView(curr => {
          if (curr !== 'home') {
            setForwardHistory(f => [curr, ...f.slice(0, 14)]);
            return 'home';
          }
          return curr;
        });
        return h;
      }
      const prev = h[h.length - 1];
      setView(curr => {
        setForwardHistory(f => [curr, ...f.slice(0, 14)]);
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
        return next;
      });
      return f.slice(1);
    });
  }, []);

  useEffect(() => {
    const initApp = async () => {
        storageService.init(DEFAULT_WORKOUT);
        const localUser = storageService.getUser();
        if (localUser) {
            if (localUser.role !== 'owner') {
                const syncedList = await storageService.syncAthletesFromCloud();
                const fresh = syncedList.find(u => u.id === localUser.id);
                if (fresh) {
                    const now = new Date();
                    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const isDemoAccount = fresh.email?.toLowerCase().endsWith('@demo.com') || fresh.name?.toLowerCase().includes('(demo)');
                    const expired = !fresh.isUnlimited && !isDemoAccount && fresh.role === 'client' && fresh.cycleEndDate && fresh.cycleEndDate < todayIso;
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
    
    const [templates] = await Promise.all([
      storageService.getTemplates(user.role === 'client' ? user.id : undefined),
      calendarService.syncCalendarFromCloud(user.role === 'client' ? user.id : undefined),
      storageService.syncLogsFromCloud(user.role === 'client' ? user.id : undefined),
      storageService.syncAthletesFromCloud()
    ]);
    setAvailableTemplates(templates);
    
    const today = new Date();
    const scheduledWorkoutId = calendarService.getScheduledSession(today, user.id);
    
    if (scheduledWorkoutId) {
      const scheduledWorkout = templates.find(t => t.id === scheduledWorkoutId) || storageService.getWorkoutById(scheduledWorkoutId);
      if (scheduledWorkout) {
        setCurrentWorkout(scheduledWorkout);
        return;
      }
    }
    
    setCurrentWorkout(EMPTY_WORKOUT);
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
      setCurrentWorkout(workout);
      setView('tracker');
  };

  const handleFinishWorkout = (progress: ProgressState) => {
    storageService.saveSessionLogs(progress.workoutLogs);
    storageService.markSessionComplete(currentWorkout.id, user?.id);
    refreshWorkoutContext();
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
        {/* Barra Superior de Identidad de Coach / Dueño (Compacta en móvil y desktop) */}
        <header className="sticky top-0 z-[400] bg-[#050507]/95 backdrop-blur-xl border-b border-white/10 px-3 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-9 h-9 rounded-xl bg-black border border-cyan-500/40 p-0.5 overflow-hidden shadow-[0_0_12px_rgba(0,240,255,0.25)] flex items-center justify-center shrink-0">
                    <img 
                        src="/assets/aistudio/1759185151992_02f8a860.jpg" 
                        alt="Kinetix Logo" 
                        className="w-full h-full object-cover rounded-lg"
                    />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] md:text-xs font-black uppercase text-white tracking-wider truncate">
                            {user.name.toLowerCase().includes('leslie') ? '👑 Leslie' : user.name.toLowerCase().includes('jorge') ? '👑 Jorge González' : user.name}
                        </span>
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest bg-red-600/20 text-red-400 border border-red-500/40 shrink-0">
                            {user.name.toLowerCase().includes('jorge') ? 'HEAD COACH & DUEÑO' : user.name.toLowerCase().includes('leslie') ? 'DUEÑA & COACH' : 'COACH'}
                        </span>
                    </div>
                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider truncate">
                        <span className="text-cyan-400 font-black">Kinetix</span> · {VIEW_LABELS[view]}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {/* Navegación Global Anterior / Siguiente para Coach y Dueños */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-0.5">
                    <button
                        type="button"
                        onClick={goBack}
                        disabled={navHistory.length === 0 && view === 'home'}
                        className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-white/85 hover:bg-white/15 disabled:opacity-25 transition-all"
                        title="Regresar a la vista anterior"
                    >
                        ← Regresar
                    </button>
                    <button
                        type="button"
                        onClick={goForward}
                        disabled={forwardHistory.length === 0}
                        className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-white/85 hover:bg-white/15 disabled:opacity-25 transition-all"
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
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-600 text-cyan-300 hover:text-white text-[9px] font-black uppercase tracking-wider border border-cyan-500/30 transition-all"
                        title="Control de Pagos & Membresías (Solo Dueños)"
                    >
                        <span>💳</span> <span className="hidden sm:inline">Pagos</span>
                    </a>
                )}

                {/* Enlace a App de Cargas, RM & Peso */}
                <a 
                    href="https://kinetix-progress.vercel.app/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-600 text-red-300 hover:text-white text-[9px] font-black uppercase tracking-wider border border-red-500/30 transition-all"
                    title="Seguimiento de Cargas & RM (kinetix-progress.vercel.app)"
                >
                    <span>📈</span> <span className="hidden sm:inline">RM</span>
                </a>

                {/* Calculadora de Unidades KG ⇄ LBS */}
                <button 
                    onClick={() => setShowUnitConverter(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black text-[9px] font-black uppercase tracking-wider border border-white/20 transition-all"
                    title="Convertir Kilogramos y Libras"
                >
                    <span>⚖️</span> <span className="hidden md:inline">KG⇄LBS</span>
                </button>

                {(user.role === 'admin' || user.role === 'owner') && (
                    <button 
                        onClick={() => navigateTo('admin_dashboard')} 
                        className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-[9px] font-black uppercase tracking-wider border border-blue-500/40 transition-all"
                    >
                        <span>⚙️</span> Sistema
                    </button>
                )}
                <button 
                    onClick={handleLogout} 
                    className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-red-950/60 text-white/60 hover:text-red-400 text-[9px] font-black uppercase tracking-wider border border-white/10 transition-all"
                    title="Cerrar Sesión"
                >
                    Salir
                </button>
            </div>
        </header>

        <nav className="fixed bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 bg-[#0F0F11]/95 backdrop-blur-3xl border border-white/15 px-5 md:px-8 py-3 md:py-4 rounded-3xl flex items-center gap-6 md:gap-12 z-[500] shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
            <button onClick={() => navigateTo('home')} className={`group flex flex-col items-center gap-0.5 transition-all ${view === 'home' ? 'text-red-500 scale-105' : 'text-white/50 hover:text-white'}`}>
                <span className="text-lg md:text-xl">📊</span>
                <span className="text-[8px] font-black uppercase tracking-wider">Inicio</span>
            </button>
            <button onClick={() => navigateTo('crm')} className={`group flex flex-col items-center gap-0.5 transition-all ${view === 'crm' ? 'text-red-500 scale-105' : 'text-white/50 hover:text-white'}`}>
                <span className="text-lg md:text-xl">👥</span>
                <span className="text-[8px] font-black uppercase tracking-wider">Atletas</span>
            </button>
            <button onClick={() => navigateTo('manager')} className={`group flex flex-col items-center gap-0.5 transition-all ${view === 'manager' ? 'text-red-500 scale-105' : 'text-white/50 hover:text-white'}`}>
                <span className="text-lg md:text-xl">📐</span>
                <span className="text-[8px] font-black uppercase tracking-wider">Rutinas</span>
            </button>
            {(user.role === 'admin' || user.role === 'owner') && (
                <button onClick={() => navigateTo('admin_dashboard')} className={`group flex flex-col items-center gap-0.5 transition-all ${view === 'admin_dashboard' ? 'text-blue-500 scale-105' : 'text-white/50 hover:text-white'}`}>
                    <span className="text-lg md:text-xl">⚙️</span>
                    <span className="text-[8px] font-black uppercase tracking-wider">Sistema</span>
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
