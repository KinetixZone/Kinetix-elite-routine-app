import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { WorkoutLog } from '../../types/kinetix';

interface ProgressChartProps {
  logs: WorkoutLog[];
  athleteId?: string;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  tonnage: number;
  totalSets: number;
  totalReps: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data: ChartDataPoint = payload[0].payload;
    return (
      <div className="bg-[#0D0D10] border border-red-600/40 p-3 rounded-2xl shadow-2xl backdrop-blur-md">
        <p className="text-[9px] font-black uppercase text-red-500 tracking-widest mb-1">{data.displayDate}</p>
        <p className="text-xl font-black text-white italic tracking-tighter">
          {Math.round(data.tonnage).toLocaleString()} <span className="text-xs text-red-400 not-italic">KG TONELAJE</span>
        </p>
        <div className="flex gap-4 mt-2 pt-2 border-t border-white/10 text-[8px] font-black uppercase tracking-wider text-white/50">
          <span>{data.totalSets} Series</span>
          <span>{data.totalReps} Repeticiones</span>
        </div>
      </div>
    );
  }
  return null;
};

export const ProgressChart: React.FC<ProgressChartProps> = ({ logs, athleteId }) => {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const filteredLogs = athleteId ? logs.filter(l => !l.athleteId || l.athleteId === athleteId) : logs;
    
    // Group by day (YYYY-MM-DD)
    const map = new Map<string, { tonnage: number; sets: number; reps: number }>();

    filteredLogs.forEach(log => {
      const dateKey = log.timestamp ? log.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
      const weight = Number(log.weight) || 0;
      const reps = Number(log.reps) || 0;
      const isClass = log.exerciseId === 'kinetix-class-log';
      const vol = isClass ? 8000 : weight * reps;

      const current = map.get(dateKey) || { tonnage: 0, sets: 0, reps: 0 };
      current.tonnage += vol;
      current.sets += 1;
      current.reps += reps;
      map.set(dateKey, current);
    });

    // If empty, generate a 5-day baseline
    if (map.size === 0) {
      const now = new Date();
      return Array.from({ length: 5 }).map((_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (4 - i) * 2);
        const str = d.toISOString().split('T')[0];
        return {
          date: str,
          displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
          tonnage: 0,
          totalSets: 0,
          totalReps: 0
        };
      });
    }

    const sorted = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14) // Last 14 session days
      .map(([date, val]) => {
        const parts = date.split('-');
        const displayDate = `${parts[2]}/${parts[1]}`;
        return {
          date,
          displayDate,
          tonnage: Math.round(val.tonnage),
          totalSets: val.sets,
          totalReps: val.reps
        };
      });

    return sorted;
  }, [logs, athleteId]);

  const totalCumulativeTonnage = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.tonnage, 0);
  }, [chartData]);

  const peakSessionTonnage = useMemo(() => {
    return Math.max(...chartData.map(d => d.tonnage), 0);
  }, [chartData]);

  return (
    <div className="bg-[#0F0F11] rounded-[36px] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Background radial crimson glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em]">Sobrecarga Progresiva & Tonelaje</p>
          </div>
          <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">
            {totalCumulativeTonnage.toLocaleString()} <span className="text-sm text-white/40 not-italic font-bold">KG CARGADOS</span>
          </h3>
        </div>
        <div className="text-left sm:text-right bg-black/40 px-4 py-2.5 rounded-2xl border border-white/5">
          <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Pico de Sesión</p>
          <p className="text-base font-black text-red-500 italic">{peakSessionTonnage.toLocaleString()} KG</p>
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="crimsonGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF0000" stopOpacity={0.6} />
                <stop offset="60%" stopColor="#DC2626" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#050507" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis 
              dataKey="displayDate" 
              tickLine={false} 
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} 
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: 800 }} 
            />
            <YAxis 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 8, fontWeight: 700 }}
              tickFormatter={(v) => v >= 1000 ? `${Math.round(v/1000)}k` : `${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="tonnage" 
              stroke="#FF0000" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#crimsonGradient)" 
              dot={{ stroke: '#FF0000', strokeWidth: 2, fill: '#050507', r: 4 }}
              activeDot={{ r: 6, fill: '#FF0000', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-white/5 text-[8px] font-black uppercase text-white/30 tracking-widest">
        <span>Fórmula de Tonelaje: Σ (Series × Reps × Peso)</span>
        <span>Últimas 14 Sesiones</span>
      </div>
    </div>
  );
};
