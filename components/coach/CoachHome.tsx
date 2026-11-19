
import React, { useMemo, useState, useEffect } from 'react';
import { storageService, AthleteInsight } from '../../services/storageService';
import { User, Workout } from '../../types/kinetix';

export const CoachHome: React.FC<{ onViewChange: (view: any) => void; currentUser?: User }> = ({ onViewChange, currentUser }) => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [sitrepSearch, setSitrepSearch] = useState('');
  const [sitrepFilter, setSitrepFilter] = useState<'all' | 'critical' | 'warning' | 'normal'>('all');
  const exercises = useMemo(() => storageService.getExercises(), [refreshTick]);
  const insights = useMemo(() => storageService.getAthleteInsights(), [refreshTick]);
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    let active = true;
    const syncLive = async () => {
      const [tpls] = await Promise.all([
        storageService.getTemplates(undefined, {
          onRevalidate: (fresh) => {
            if (active) setTemplates(fresh.filter(t => t.isTemplate !== false));
          }
        }),
        storageService.fetchServerTodayIso(),
        storageService.syncAthletesFromCloud(),
        storageService.syncLogsFromCloud()
      ]);
      if (active) {
        setTemplates(tpls.filter(t => t.isTemplate !== false));
        setRefreshTick(t => t + 1);
      }
    };
    syncLive();
    return () => { active = false; };
  }, []);

  const handleAdminClick = () => {
    setIsClicking(true);
    setTimeout(() => {
        onViewChange('admin_dashboard');
        setIsClicking(false);
    }, 150);
  };

  const openAthleteInCRM = (athleteId?: string, focusTab: 'profile' | 'calendar' | 'history' = 'profile') => {
    if (athleteId) localStorage.setItem('kinetix_focus_athlete_id', athleteId);
    localStorage.setItem('kinetix_focus_tab', focusTab);
    onViewChange('crm');
  };

  const criticalInsights = insights.filter(i => i.status === 'critical' || i.status === 'warning');
  const filteredInsights = useMemo(() => {
    const q = sitrepSearch.trim().toLowerCase();
    return insights.filter(i => {
      if (sitrepFilter !== 'all' && i.status !== sitrepFilter) return false;
      if (q && !i.athleteName.toLowerCase().includes(q) && !i.message.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [insights, sitrepSearch, sitrepFilter]);

  return (
    <div className="pt-6 md:pt-8 pb-28 px-4 md:px-6 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-700">
      
      {/* HEADER TÁCTICO */}
      <div className="mb-8 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
        <div className="space-y-3">
           <div className="flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-2xl bg-black border border-cyan-500/40 p-0.5 overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.35)] shrink-0">
                  <img 
                      src="/assets/aistudio/1759185151992_02f8a860.jpg" 
                      alt="Kinetix Functional Zone" 
                      className="w-full h-full object-cover rounded-xl"
                  />
              </div>
              <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#FF2A2A]">
                     Kinetix <span className="text-[#00F0FF]">Functional Zone</span>
                  </p>
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
                     Mando Central • Leslie & Jorge González
                  </p>
              </div>
           </div>
           <h1 className="text-4xl sm:text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-[0.92]">
              LIVE <span className="text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 block md:inline">OPERATIONS</span>
           </h1>
        </div>
        {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
          <button 
                onClick={handleAdminClick}
                className={`w-full md:w-auto px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl flex items-center justify-center gap-3 border ${isClicking ? 'bg-white text-black scale-95' : 'bg-blue-600 text-white hover:bg-blue-500 border-blue-400/50'}`}
             >
                <span className={`text-xl ${isClicking ? 'animate-spin' : ''}`}>⚙️</span> 
                {isClicking ? 'CONECTANDO...' : 'SISTEMA CORE & AUDITORÍA'}
          </button>
        )}
      </div>

      {/* RESUMEN RÁPIDO PARA DUEÑOS & COACHES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <button type="button" onClick={() => onViewChange('crm')} className="text-left bg-[#0F0F11] border border-white/10 hover:border-white/25 rounded-3xl p-4 md:p-5 transition-all">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/45">Atletas en Plantel</p>
          <p className="text-2xl md:text-3xl font-black italic text-white tabular-nums mt-1">{insights.length}</p>
        </button>
        <button type="button" onClick={() => setSitrepFilter(sitrepFilter === 'critical' ? 'all' : 'critical')} className="text-left bg-[#0F0F11] border border-red-500/30 hover:border-red-500/60 rounded-3xl p-4 md:p-5 transition-all">
          <p className="text-[9px] font-black uppercase tracking-widest text-red-400">Requieren Atención</p>
          <p className="text-2xl md:text-3xl font-black italic text-red-400 tabular-nums mt-1">{criticalInsights.length}</p>
        </button>
        <button type="button" onClick={() => onViewChange('manager')} className="text-left bg-[#0F0F11] border border-white/10 hover:border-cyan-500/40 rounded-3xl p-4 md:p-5 transition-all">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/45">Rutinas Master</p>
          <p className="text-2xl md:text-3xl font-black italic text-cyan-300 tabular-nums mt-1">{templates.length}</p>
        </button>
        <button type="button" onClick={() => onViewChange('library')} className="text-left bg-[#0F0F11] border border-white/10 hover:border-emerald-500/40 rounded-3xl p-4 md:p-5 transition-all">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/45">Ejercicios</p>
          <p className="text-2xl md:text-3xl font-black italic text-emerald-300 tabular-nums mt-1">{exercises.length}</p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA 1 & 2: INTEL FEED */}
        <div className="lg:col-span-2 space-y-5">
            <div className="flex flex-wrap justify-between items-center gap-2 px-1">
                <h2 className="text-[11px] font-black uppercase tracking-[0.35em] text-white/45 italic">Situational Report (SITREP)</h2>
                <span className="text-[9px] font-black text-red-500 uppercase">Actualizado Tiempo Real</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={sitrepSearch}
                  onChange={e => setSitrepSearch(e.target.value)}
                  placeholder="🔍 Buscar alumno o alerta..."
                  className="flex-1 bg-[#0F0F11] border border-white/10 focus:border-cyan-500 rounded-2xl px-4 py-3 text-xs font-bold text-white placeholder-white/35 outline-none"
                />
                <div className="flex flex-wrap bg-white/5 rounded-2xl p-1 gap-1">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'critical', label: 'Críticos' },
                    { id: 'warning', label: 'Aviso' },
                    { id: 'normal', label: 'Al Día' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSitrepFilter(tab.id as any)}
                      className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${sitrepFilter === tab.id ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
            </div>

            <div className="space-y-4">
                {filteredInsights.length === 0 ? (
                    <div className="p-10 text-center border border-dashed border-white/10 rounded-[36px]">
                        <p className="text-xs font-black uppercase text-white/35 tracking-widest">
                          {insights.length === 0 ? 'Esperando datos de alumnos...' : 'Sin alumnos que coincidan con este filtro.'}
                        </p>
                    </div>
                ) : filteredInsights.map((insight, idx) => (
                    <div
                      key={insight.athleteId || idx}
                      onClick={() => openAthleteInCRM(insight.athleteId, 'profile')}
                      className={`group relative bg-[#0F0F11] border rounded-[32px] p-5 md:p-7 transition-all hover:scale-[1.01] cursor-pointer ${insight.status === 'critical' ? 'border-red-600/40 shadow-[0_0_30px_rgba(220,38,38,0.1)]' : insight.status === 'warning' ? 'border-yellow-600/30' : 'border-white/5'}`}
                    >
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex gap-3.5 md:gap-5 items-start min-w-0">
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-lg md:text-xl font-black shrink-0 ${insight.status === 'critical' ? 'bg-red-600 text-white' : insight.status === 'warning' ? 'bg-yellow-500 text-black' : 'bg-white/5 text-white/40'}`}>
                                    {insight.athleteName.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg md:text-2xl font-black uppercase italic tracking-tight break-words leading-snug">{insight.athleteName}</h3>
                                    <p className={`text-[11px] font-bold uppercase mt-1 leading-snug break-words ${insight.status === 'critical' ? 'text-red-400' : insight.status === 'warning' ? 'text-yellow-400' : 'text-white/50'}`}>
                                        {insight.message}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[9px] font-black text-white/35 uppercase tracking-widest">Compliance</p>
                                <p className="text-xl md:text-2xl font-black italic tabular-nums">{insight.compliance}%</p>
                            </div>
                        </div>
                        
                        {insight.lastRpe && (
                            <div className="mt-5 pt-4 border-t border-white/5 flex flex-wrap gap-5 md:gap-8 items-center">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Último RPE</span>
                                    <span className={`text-lg font-black italic tabular-nums ${insight.lastRpe >= 9 ? 'text-red-500' : 'text-white'}`}>@{insight.lastRpe}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Última Actividad</span>
                                    <span className="text-[10px] font-black text-white/70 uppercase">{new Date(insight.lastWorkoutDate!).toLocaleDateString()}</span>
                                </div>
                                <div className="flex-1 text-right">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openAthleteInCRM(insight.athleteId, 'history');
                                      }}
                                      className="px-4 py-2 bg-white/5 hover:bg-white hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                    >
                                      Ver Sesión →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* COLUMNA 3: ESTADÍSTICAS RÁPIDAS */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-red-600 to-red-950 p-6 md:p-8 rounded-[38px] shadow-2xl relative overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/75">Alertas Críticas</h4>
                    <p className="text-6xl font-black text-white italic tracking-tighter tabular-nums mt-1">{criticalInsights.length}</p>
                    <p className="text-[11px] font-bold text-white/80 mt-1">
                      {criticalInsights.length > 0 ? 'Membresía vencida, pausa, inactividad o RPE alto' : 'Todo tu equipo está al día y estable'}
                    </p>
                  </div>
                  <span className="text-4xl font-black italic text-white/15 select-none">!</span>
                </div>

                {criticalInsights.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-white/15 space-y-2">
                    {criticalInsights.slice(0, 5).map((alert, aIdx) => (
                      <button
                        key={alert.athleteId || aIdx}
                        type="button"
                        onClick={() => openAthleteInCRM(alert.athleteId, alert.lastRpe && alert.lastRpe >= 9 ? 'history' : 'profile')}
                        className="w-full text-left bg-black/35 hover:bg-black/60 border border-white/15 rounded-2xl px-3.5 py-2.5 transition-all flex items-center justify-between gap-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase text-white break-words leading-snug">{alert.athleteName}</p>
                          <p className="text-[10px] text-amber-200/95 break-words leading-snug mt-0.5">{alert.message}</p>
                        </div>
                        <span className="text-[9px] font-black uppercase text-white bg-red-600 px-2.5 py-1.5 rounded-lg shrink-0">
                          Revisar →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div onClick={() => onViewChange('manager')} className="bg-[#0F0F11] border border-white/5 p-6 rounded-[35px] hover:border-white/20 transition-all cursor-pointer">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Rutinas Master</p>
                    <p className="text-3xl font-black italic tabular-nums">{templates.length}</p>
                </div>
                <div onClick={() => onViewChange('library')} className="bg-[#0F0F11] border border-white/5 p-6 rounded-[35px] hover:border-white/20 transition-all cursor-pointer">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Ejercicios</p>
                    <p className="text-3xl font-black italic tabular-nums">{exercises.length}</p>
                </div>
            </div>

            {/* ECOSISTEMA: CONTROL DE PAGOS (SOLO VISIBLE PARA DUEÑOS) */}
            {currentUser?.role === 'owner' && (
                <div className="bg-[#0F0F11] border border-cyan-500/30 p-8 rounded-[40px] space-y-4 shadow-[0_0_30px_rgba(0,240,255,0.08)]">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400">Panel Financiero</span>
                        <span className="text-[7px] bg-cyan-950 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-500/30">DUEÑOS</span>
                    </div>
                    <h4 className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">Control de Pagos & Membresías</h4>
                    <p className="text-[9px] text-white/40 leading-relaxed">
                       Gestión de suscripciones, cuotas activas e historial de facturación de Kinetix Functional Zone.
                    </p>
                    <a 
                       href="https://kinetix-control.vercel.app/" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="w-full py-4 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                       <span>💳</span> Abrir kinetix-control.vercel.app ↗
                    </a>
                </div>
            )}

            {/* SEGUIMIENTO DE CARGAS, RM Y PESO (PARA TODOS LOS COACHES) */}
            <div className="bg-[#0F0F11] border border-red-500/20 p-8 rounded-[40px] space-y-4 shadow-[0_0_30px_rgba(255,0,0,0.05)]">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500">Biomecánica & Cargas</span>
                    <span className="text-[7px] bg-red-950 text-red-400 font-mono px-2 py-0.5 rounded-full border border-red-500/30">MÉTRICAS</span>
                </div>
                <h4 className="text-xl font-black uppercase italic tracking-tight text-white leading-tight">Seguimiento de Cargas & RM</h4>
                <p className="text-[9px] text-white/40 leading-relaxed">
                   Consulta récords 1RM, volumen por grupo muscular y evolución de peso corporal de los atletas.
                </p>
                <a 
                   href="https://kinetix-progress.vercel.app/" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="w-full py-4 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                   <span>📈</span> Abrir kinetix-progress.vercel.app ↗
                </a>
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
