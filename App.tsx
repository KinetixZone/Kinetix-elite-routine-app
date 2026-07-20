
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'home' | 'manager' | 'tracker' | 'crm' | 'library' | 'athlete_home' | 'admin_dashboard'>('athlete_home');
  const [currentWorkout, setCurrentWorkout] = useState<Workout>(EMPTY_WORKOUT);
  const [availableTemplates, setAvailableTemplates] = useState<Workout[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = () => {
        storageService.init(DEFAULT_WORKOUT);
        const localUser = storageService.getUser();
        if (localUser) {
            setUser(localUser);
            if (localUser.role === 'client') setView('athlete_home');
            else if (localUser.role === 'owner') setView('admin_dashboard');
            else setView('home');
        }
        setIsLoading(false);
    };
    initApp();
  }, []);

  const refreshWorkoutContext = useCallback(async () => {
    if (!user) return;
    
    // EL CAMBIO CLAVE: Esperar a que getTemplates consulte la nube (Supabase)
    const templates = await storageService.getTemplates(user.role === 'client' ? user.id : undefined);
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
    if (user && view === 'athlete_home') {
        refreshWorkoutContext();
    }
  }, [user, view, refreshWorkoutContext]);

  const handleLoginSuccess = (newUser: User) => {
      setUser(newUser);
      if (newUser.role === 'owner') setView('admin_dashboard');
      else if (newUser.role === 'client') setView('athlete_home');
      else setView('home');
  };

  const handleLogout = () => {
      storageService.logout();
      setUser(null);
      setCurrentWorkout(EMPTY_WORKOUT);
      setView('athlete_home');
  };

  const handleStartSession = (workout: Workout) => {
      setCurrentWorkout(workout);
      setView('tracker');
  };

  const handleFinishWorkout = (progress: ProgressState) => {
    storageService.saveSessionLogs(progress.workoutLogs);
    storageService.markSessionComplete(currentWorkout.id);
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
                <LiveTracker workout={currentWorkout} user={user} onFinish={handleFinishWorkout} />
            ) : (
                <AthleteHome 
                    user={user} 
                    currentWorkout={currentWorkout} 
                    availableWorkouts={availableTemplates}
                    onStartSession={handleStartSession}
                    onLogout={handleLogout}
                />
            )}
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#050507] text-white pb-32">
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0F0F11]/95 backdrop-blur-3xl border border-white/10 px-6 md:px-10 py-5 rounded-[35px] flex gap-8 md:gap-14 z-[500] shadow-[0_30px_70px_rgba(0,0,0,0.8)]">
            <button onClick={() => setView('home')} className={`group flex flex-col items-center gap-1 transition-all ${view === 'home' ? 'text-red-500 scale-110' : 'text-white/40 hover:text-white'}`}>
                <span className="text-xl">📊</span>
                <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Mando</span>
            </button>
            <button onClick={() => setView('crm')} className={`group flex flex-col items-center gap-1 transition-all ${view === 'crm' ? 'text-red-500 scale-110' : 'text-white/40 hover:text-white'}`}>
                <span className="text-xl">👥</span>
                <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Atletas</span>
            </button>
            <button onClick={() => setView('manager')} className={`group flex flex-col items-center gap-1 transition-all ${view === 'manager' ? 'text-red-500 scale-110' : 'text-white/40 hover:text-white'}`}>
                <span className="text-xl">📐</span>
                <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Protocolo</span>
            </button>
            {(user.role === 'admin' || user.role === 'owner') && (
                <button onClick={() => setView('admin_dashboard')} className={`group flex flex-col items-center gap-1 transition-all ${view === 'admin_dashboard' ? 'text-blue-500 scale-110' : 'text-white/40 hover:text-white'}`}>
                    <span className="text-xl">🔐</span>
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Búnker</span>
                </button>
            )}
            <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-red-900 border-l border-white/10 pl-6 md:pl-8 group">
                <span className="text-xl group-hover:scale-110 transition-transform">🚪</span>
                <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">Off</span>
            </button>
        </nav>

        <main className="animate-in fade-in duration-500">
            {view === 'tracker' && <LiveTracker workout={currentWorkout} user={user} onFinish={handleFinishWorkout} />}
            {view === 'home' && <CoachHome onViewChange={setView} />}
            {view === 'crm' && <AthleteCRM onSwitchUser={refreshWorkoutContext} />}
            {view === 'library' && <ExerciseLibrary />}
            {view === 'manager' && <WorkoutManager />}
            {view === 'admin_dashboard' && <AdminDashboard currentUser={user} onNavigate={setView} />}
        </main>
    </div>
  );
};

export default App;
