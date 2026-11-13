import React, { useMemo, useState } from 'react';
import { storageService } from '../../services/storageService';
import { EXERCISES_DB } from '../../constants/exercises';
import { BodyMetric } from '../../types/kinetix';
import { ProgressChart } from './ProgressChart';

// HELPER: Categorías de músculos para simplificar el análisis
const MUSCLE_ZONES: Record<string, string> = {
  'Pecho': 'Push', 'Hombro': 'Push', 'Tríceps': 'Push',
  'Espalda': 'Pull', 'Bíceps': 'Pull', 'Abdomen': 'Core',
  'Piernas': 'Legs', 'Glúteo': 'Legs',
  'Funcional': 'Metabolic', 'Halterofilia': 'Power',
  'Venue': 'Metabolic' 
};

const RANK_SYSTEM = [
  { name: 'ROOKIE', min: 0, color: 'text-white/40', barColor: 'bg-white/20' },
  { name: 'PROSPECT', min: 50000, color: 'text-blue-400', barColor: 'bg-blue-500' },
  { name: 'ELITE', min: 150000, color: 'text-red-600', barColor: 'bg-red-600' },
  { name: 'LEGEND', min: 500000, color: 'text-yellow-500', barColor: 'bg-yellow-500' }
];

export const ProgressDashboard: React.FC = () => {
  // Data Fetching
  const logs = useMemo(() => storageService.getAllLogs(), []);
  const allExercises = useMemo(() => storageService.getExercises(), []);

  // --- PERFORMANCE LOGIC ---
  const lifetimeVolume = useMemo(() => {
     return logs.reduce((acc, log) => {
         const vol = log.exerciseId === 'kinetix-class-log' 
            ? 10000 
            : (Number(log.weight) || 0) * (Number(log.reps) || 0);
         return acc + vol;
     }, 0);
  }, [logs]);

  const currentRank = useMemo(() => {
     return [...RANK_SYSTEM].reverse().find(r => lifetimeVolume >= r.min) || RANK_SYSTEM[0];
  }, [lifetimeVolume]);

  const nextRank = useMemo(() => {
      const idx = RANK_SYSTEM.findIndex(r => r.name === currentRank.name);
      return RANK_SYSTEM[idx + 1] || null;
  }, [currentRank]);

  const progressToNextRank = useMemo(() => {
      if (!nextRank) return 100;
      const prevMin = currentRank.min;
      const target = nextRank.min;
      const current = lifetimeVolume;
      const percent = ((current - prevMin) / (target - prevMin)) * 100;
      return Math.min(Math.max(Math.round(percent), 0), 100);
  }, [lifetimeVolume, currentRank, nextRank]);

  const activeStreak = useMemo(() => {
      const rawDates = logs.map(l => l.timestamp.split('T')[0]);
      const uniqueDates = rawDates
        .filter((date, index, self) => self.indexOf(date) === index)
        .sort()
        .reverse();
      
      if (uniqueDates.length === 0) return 0;

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const yesterdayDate = new Date(now);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split('T')[0];

      const lastWorkout = uniqueDates[0];
      if (lastWorkout !== today && lastWorkout !== yesterday) return 0;

      let streak = 1;
      let currentDateStr = lastWorkout;

      for (let i = 1; i < uniqueDates.length; i++) {
          const prevDateStr = uniqueDates[i];
          const d1 = new Date(currentDateStr);
          const d2 = new Date(prevDateStr);
          const diffTime = Math.abs(d1.getTime() - d2.getTime());
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
              streak++;
              currentDateStr = prevDateStr;
          } else {
              break; 
          }
      }
      return streak;
  }, [logs]);

  const muscleSplit = useMemo(() => {
     const last30Days = new Date();
     last30Days.setDate(last30Days.getDate() - 30);
     const cutoff = last30Days.toISOString();

     const recentLogs = logs.filter(l => l.timestamp >= cutoff);
     const counts: Record<string, number> = { 'Push': 0, 'Pull': 0, 'Legs': 0, 'Metabolic': 0, 'Core': 0, 'Power': 0 };
     let totalSets = 0;

     recentLogs.forEach(log => {
         let zone = 'Metabolic';
         if (log.exerciseId === 'kinetix-class-log') {
             zone = 'Metabolic';
         } else {
             const ex = allExercises.find(e => e.id === log.exerciseId) || EXERCISES_DB.find(e => e.id === log.exerciseId);
             if (ex) {
                 const rawMuscle = ex.muscleGroup.split('/')[0].trim();
                 zone = MUSCLE_ZONES[rawMuscle] || 'Metabolic';
             }
         }
         if (counts[zone] !== undefined) {
             counts[zone]++;
             totalSets++;
         }
     });

     return Object.entries(counts)
        .map(([zone, count]) => ({ 
            zone, 
            count, 
            percent: totalSets > 0 ? Math.round((count / totalSets) * 100) : 0 
        }))
        .sort((a, b) => b.percent - a.percent)
        .filter(x => x.percent > 0);

  }, [logs, allExercises]);

  const volumeData = useMemo(() => {
    const aggregation: Record<string, { vol: number, isClass: boolean }> = {};
    logs.forEach(log => {
      const dateKey = log.timestamp.split('T')[0];
      const isVenueLog = log.exerciseId === 'kinetix-class-log';
      let volume = 0;
      if (isVenueLog) volume = 10000;
      else volume = (Number(log.weight) || 0) * (Number(log.reps) || 0);

      if (!aggregation[dateKey]) aggregation[dateKey] = { vol: 0, isClass: false };
      aggregation[dateKey].vol += volume;
      if (isVenueLog) aggregation[dateKey].isClass = true;
    });

    return Object.entries(aggregation)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-7);
  }, [logs]);

  const heatmap = useMemo(() => {
    const days = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 59; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      const dateStr = targetDate.toISOString().split('T')[0];
      const dayLogs = logs.filter(l => l.timestamp.startsWith(dateStr));
      let setTotal = dayLogs.length;
      if (dayLogs.some(l => l.exerciseId === 'kinetix-class-log')) setTotal += 15; 
      days.push({
        date: dateStr,
        intensity: setTotal === 0 ? 0 : setTotal < 5 ? 1 : setTotal < 12 ? 2 : 3
      });
    }
    return days;
  }, [logs]);

  const fatigueMetrics = useMemo(() => {
    if (logs.length < 5) return { index: 0, status: 'Sin Datos' };
    const recentVolume = volumeData[volumeData.length - 1]?.[1].vol || 0;
    const avgVolume = volumeData.reduce((acc, curr) => acc + curr[1].vol, 0) / (volumeData.length || 1);
    const index = Math.min(Math.max(Math.round((recentVolume / (avgVolume || 1)) * 85), 40), 98);
    const status = index > 90 ? 'SOBREENTRENO' : index > 75 ? 'ALTA INTENSIDAD' : 'ÓPTIMO';
    return { index, status };
  }, [volumeData, logs]);

  const recentPRs = useMemo(() => {
    return logs
      .filter(l => l.isPR && l.exerciseId !== 'kinetix-class-log')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3)
      .map(log => ({
        exercise: allExercises.find(ex => ex.id === log.exerciseId)?.name || 'Unknown',
        val: log.weight,
        date: new Date(log.timestamp).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
      }));
  }, [logs, allExercises]);

  const maxVol = Math.max(...volumeData.map(d => d[1].vol), 1);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      
      {/* ENLACE A APP EXTERNA OFICIAL DE PESO, MEDIDAS Y 1RM */}
      <div className="bg-[#0F0F11] border border-cyan-500/25 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Ecosistema Kinetix Progress</p>
              <p className="text-xs text-white/70 mt-0.5">
                  Tu historial completo de peso corporal, medidas y 1RM vive en tu app dedicada de progreso.
              </p>
          </div>
          <a 
              href="https://kinetix-progress.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all shrink-0"
          >
              Abrir Cargas & Medidas ↗
          </a>
      </div>

      {/* --- VIEW: PERFORMANCE --- */}
      <div className="space-y-6">
            {/* ELITE RANK CARD */}
            <div className="bg-gradient-to-br from-[#1A1A1D] to-black rounded-[40px] p-8 border border-white/5 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-6 opacity-5 font-black text-9xl italic tracking-tighter select-none pointer-events-none">
                    {currentRank.name}
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Kinetix Rank</p>
                            <h2 className={`text-4xl font-black uppercase italic tracking-tighter ${currentRank.color} drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
                                {currentRank.name}
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Lifetime Volume</p>
                            <p className="text-xl font-black text-white">{Math.floor(lifetimeVolume / 1000)}k <span className="text-xs text-white/40">PTS</span></p>
                        </div>
                    </div>
                    {nextRank ? (
                        <div className="space-y-2">
                            <div className="flex justify-between text-[8px] font-black uppercase text-white/40 tracking-widest">
                                <span>Progreso a {nextRank.name}</span>
                                <span>{progressToNextRank}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${currentRank.barColor}`} style={{ width: `${progressToNextRank}%` }} />
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-xl text-center">
                            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">👑 Rango Máximo Alcanzado</p>
                        </div>
                    )}
                </div>
            </div>

            {/* CONSISTENCY ENGINE (RACHA + HEATMAP) */}
            <div className="bg-[#0F0F11] rounded-[40px] border border-white/5 p-6 shadow-xl flex flex-col md:flex-row gap-8">
                {/* RACHA ACTUAL */}
                <div className="flex-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-6">
                    <div className="text-5xl mb-2 relative">
                        🔥
                        {activeStreak > 2 && (
                            <div className="absolute -inset-4 bg-red-600/20 blur-xl rounded-full animate-pulse z-[-1]" />
                        )}
                    </div>
                    <h3 className="text-5xl font-black text-white italic tracking-tighter mb-1">{activeStreak}</h3>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Días Seguidos</p>
                    {activeStreak === 0 && <p className="text-[8px] text-white/20 mt-2">¡Entrena hoy para encender la llama!</p>}
                </div>

                {/* HEATMAP */}
                <div className="flex-[2] flex flex-col">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        Mapa de Calor (60D)
                    </p>
                    <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] gap-1.5 flex-1 content-center">
                        {heatmap.map((day, i) => (
                        <div 
                            key={i}
                            title={day.date}
                            className={`aspect-square rounded-[2px] transition-all hover:scale-125 ${
                            day.intensity === 0 ? 'bg-white/5' :
                            day.intensity === 1 ? 'bg-red-900/40' :
                            day.intensity === 2 ? 'bg-red-700/80' : 'bg-red-500 shadow-[0_0_5px_rgba(255,0,0,0.5)]'
                            }`}
                        />
                        ))}
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: MUSCLE SPLIT + FATIGA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0F0F11] rounded-[40px] border border-white/5 p-8 shadow-xl">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-xl">🎯</span>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Enfoque (30 Días)</p>
                    </div>
                    
                    {muscleSplit.length > 0 ? (
                        <div className="space-y-4">
                            {muscleSplit.slice(0, 4).map((item, i) => (
                                <div key={item.zone} className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/60">
                                        <span>{item.zone}</span>
                                        <span>{item.percent}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex items-center">
                                        <div 
                                            className={`h-full rounded-full ${
                                                item.zone === 'Legs' ? 'bg-purple-600' : 
                                                item.zone === 'Metabolic' ? 'bg-red-600' :
                                                item.zone === 'Push' ? 'bg-blue-500' : 
                                                item.zone === 'Pull' ? 'bg-yellow-500' : 'bg-green-500'
                                            }`} 
                                            style={{ width: `${item.percent}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 opacity-30">
                            <p className="text-[9px] font-black uppercase tracking-widest">Sin datos suficientes</p>
                        </div>
                    )}
                </div>

                <div className="bg-[#0F0F11] rounded-[40px] border border-white/5 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl">
                    <div className="absolute inset-0 bg-red-600/5 blur-[80px] pointer-events-none" />
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Fatigue Index</p>
                    
                    <div className="relative">
                        <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-red-600 transition-all duration-1000" 
                            strokeDasharray={251} strokeDashoffset={251 - (251 * fatigueMetrics.index) / 100} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black italic tracking-tighter">{fatigueMetrics.index}%</span>
                        </div>
                    </div>
                    
                    <div className="mt-4">
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{fatigueMetrics.status}</p>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 4: GRÁFICA DE TONELAJE Y SOBRECARGA PROGRESIVA CON RECHARTS */}
            <ProgressChart logs={logs} />

            {/* SECCIÓN 5: PRs RECIENTES */}
            <div className="bg-[#0F0F11] rounded-[40px] border border-white/5 p-8 shadow-2xl">
                <h3 className="text-lg font-black uppercase italic tracking-widest mb-6">Breakthroughs</h3>
                <div className="space-y-3">
                    {recentPRs.map((pr, i) => (
                    <div key={i} className="group bg-black/40 border border-white/5 hover:border-red-600/40 p-4 rounded-2xl flex justify-between items-center transition-all duration-500">
                        <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center text-red-600 font-black text-[10px] group-hover:bg-red-600 group-hover:text-white transition-colors">
                            #{i + 1}
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase italic tracking-tight">{pr.exercise}</p>
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{pr.date}</p>
                        </div>
                        </div>
                        <div className="text-right">
                        <p className="text-lg font-black text-white">{pr.val} <span className="text-[10px] text-white/30">KG</span></p>
                        </div>
                    </div>
                    ))}
                    {recentPRs.length === 0 && (
                    <p className="text-center py-6 text-white/10 text-[9px] font-black uppercase italic tracking-widest">Buscando nuevos límites...</p>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};