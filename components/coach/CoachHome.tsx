
import React, { useMemo, useState, useEffect } from 'react';
import { storageService, AthleteInsight } from '../../services/storageService';
import { User, Workout } from '../../types/kinetix';

export const CoachHome: React.FC<{ onViewChange: (view: any) => void }> = ({ onViewChange }) => {
  const athletes = useMemo(() => storageService.getAthletes(), []);
  // Fix: storageService.getTemplates() is async, so use useState + useEffect to avoid handling a raw Promise object.
  const [templates, setTemplates] = useState<Workout[]>([]);
  const exercises = useMemo(() => storageService.getExercises(), []);
  const insights = useMemo(() => storageService.getAthleteInsights(), []);
  const storageStats = storageService.getStorageUsage();
  const [isClicking, setIsClicking] = useState(false);

  // Load templates asynchronously on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      const t = await storageService.getTemplates();
      setTemplates(t);
    };
    loadTemplates();
  }, []);

  const handleAdminClick = () => {
    setIsClicking(true);
    setTimeout(() => {
        onViewChange('admin_dashboard');
        setIsClicking(false);
    }, 150);
  };

  const criticalInsights = insights.filter(i => i.status === 'critical' || i.status === 'warning');

  return (
    <div className="pt-20 pb-32 px-4 md:px-6 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-700">
      
      {/* HEADER TÁCTICO */}
      <div className="mb-10 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
        <div className="space-y-1 md:space-y-2">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
              <p className="text-[9px] md:text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Cuartel General de Mando</p>
           </div>
           <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-[0.9]">
              LIVE <span className="text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 block md:inline">OPERATIONS</span>
           </h1>
        </div>
        <button 
              onClick={handleAdminClick}
              className={`w-full md:w-auto px-10 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] transition-all shadow-xl flex items-center justify-center gap-4 border ${isClicking ? 'bg-white text-black scale-95' : 'bg-blue-600 text-white hover:bg-blue-500 border-blue-400/50'}`}
           >
              <span className={`text-xl ${isClicking ? 'animate-spin' : ''}`}>⚙️</span> 
              {isClicking ? 'CONECTANDO...' : 'SISTEMA CORE'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA 1 & 2: INTEL FEED */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center px-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/30 italic">Situational Report (SITREP)</h2>
                <span className="text-[8px] font-black text-red-600 animate-pulse uppercase">Actualizado Tiempo Real</span>
            </div>

            <div className="space-y-4">
                {insights.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-white/5 rounded-[40px]">
                        <p className="text-[10px] font-black uppercase text-white/10 tracking-widest">Esperando Transmisión de Datos...</p>
                    </div>
                ) : insights.map((insight, idx) => (
                    <div key={idx} onClick={() => onViewChange('crm')} className={`group relative bg-[#0F0F11] border rounded-[35px] p-8 transition-all hover:scale-[1.01] cursor-pointer ${insight.status === 'critical' ? 'border-red-600/40 shadow-[0_0_30px_rgba(220,38,38,0.1)]' : insight.status === 'warning' ? 'border-yellow-600/30' : 'border-white/5'}`}>
                        <div className="flex justify-between items-start">
                            <div className="flex gap-6 items-center">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black ${insight.status === 'critical' ? 'bg-red-600 text-white' : insight.status === 'warning' ? 'bg-yellow-500 text-black' : 'bg-white/5 text-white/40'}`}>
                                    {insight.athleteName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tight">{insight.athleteName}</h3>
                                    <p className={`text-[10px] font-bold uppercase mt-1 ${insight.status === 'critical' ? 'text-red-500' : insight.status === 'warning' ? 'text-yellow-500' : 'text-white/20'}`}>
                                        {insight.message}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Compliance</p>
                                <p className="text-2xl font-black italic">{insight.compliance}%</p>
                            </div>
                        </div>
                        
                        {insight.lastRpe && (
                            <div className="mt-6 pt-6 border-t border-white/5 flex gap-8 items-center">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Último RPE</span>
                                    <span className={`text-lg font-black italic ${insight.lastRpe >= 9 ? 'text-red-600' : 'text-white'}`}>@{insight.lastRpe}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Última Actividad</span>
                                    <span className="text-[10px] font-black text-white/60 uppercase">{new Date(insight.lastWorkoutDate!).toLocaleDateString()}</span>
                                </div>
                                <div className="flex-1 text-right">
                                    <button className="px-4 py-2 bg-white/5 hover:bg-white hover:text-black rounded-xl text-[8px] font-black uppercase tracking-widest transition-all">Ver Sesión</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* COLUMNA 3: ESTADÍSTICAS RÁPIDAS */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-red-600 to-red-900 p-10 rounded-[45px] shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 text-9xl opacity-10 font-black italic group-hover:scale-110 transition-transform">!</div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-white/60">Alertas Críticas</h4>
                <p className="text-7xl font-black text-white italic tracking-tighter">{criticalInsights.length}</p>
                <p className="text-[10px] font-black text-white/40 uppercase mt-4 tracking-widest">Requieren Intervención</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div onClick={() => onViewChange('manager')} className="bg-[#0F0F11] border border-white/5 p-6 rounded-[35px] hover:border-white/20 transition-all cursor-pointer">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Templates</p>
                    <p className="text-3xl font-black italic">{templates.length}</p>
                </div>
                <div onClick={() => onViewChange('library')} className="bg-[#0F0F11] border border-white/5 p-6 rounded-[35px] hover:border-white/20 transition-all cursor-pointer">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Ejercicios</p>
                    <p className="text-3xl font-black italic">{exercises.length}</p>
                </div>
            </div>

            <div className="bg-[#0F0F11] border border-white/5 p-8 rounded-[40px] space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">System Health</h4>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 w-[95%] shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                </div>
                <div className="flex justify-between text-[8px] font-black uppercase text-white/20 tracking-widest">
                    <span>Database Stable</span>
                    <span>95% Opt.</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
