import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { WorkoutLog } from '../../types/kinetix';
import { storageService } from '../../services/storageService';

interface ProgressChartProps {
  logs: WorkoutLog[];
  athleteId?: string;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  maxWeight: number;
  tonnage: number;
  totalSets: number;
  totalReps: number;
}

const CustomTooltip = ({ active, payload, mode }: any) => {
  if (active && payload && payload.length) {
    const data: ChartDataPoint = payload[0].payload;
    return (
      <div className="bg-[#0D0D10] border border-red-600/40 p-3 rounded-2xl shadow-2xl backdrop-blur-md">
        <p className="text-[9px] font-black uppercase text-red-500 tracking-widest mb-1">{data.displayDate}</p>
        {mode === 'maxWeight' ? (
          <p className="text-xl font-black text-white italic tracking-tighter">
            {data.maxWeight} <span className="text-xs text-cyan-400 not-italic">KG CARGA MÁX</span>
          </p>
        ) : (
          <p className="text-xl font-black text-white italic tracking-tighter">
            {Math.round(data.tonnage).toLocaleString()} <span className="text-xs text-red-400 not-italic">KG VOLUMEN</span>
          </p>
        )}
        <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-white/10 text-[8px] font-black uppercase tracking-wider text-white/55">
          <span>Máx: {data.maxWeight} kg</span>
          <span>{data.totalSets} Series</span>
          <span>{data.totalReps} Reps</span>
          <span>Vol: {Math.round(data.tonnage).toLocaleString()} kg</span>
        </div>
      </div>
    );
  }
  return null;
};

export const ProgressChart: React.FC<ProgressChartProps> = ({ logs, athleteId }) => {
  const [chartMode, setChartMode] = useState<'maxWeight' | 'tonnage'>('maxWeight');

  const chartData = useMemo<ChartDataPoint[]>(() => {
    const filteredLogs = logs.filter(l =>
      (!athleteId || l.athleteId === athleteId) &&
      l.exerciseId !== 'kinetix-session-done' &&
      l.exerciseId !== 'kinetix-session-reopen' &&
      (Number(l.weight) > 0 || Number(l.reps) > 0 || l.exerciseId === 'kinetix-class-log')
    );
    
    const map = new Map<string, { maxWeight: number; tonnage: number; sets: number; reps: number }>();

    filteredLogs.forEach(log => {
      const dateKey = storageService.getLogServerDateIso(log.timestamp) || storageService.getServerTodayIsoSync();
      const weight = Number(log.weight) || 0;
      const reps = Number(log.reps) || 0;
      const isClass = log.exerciseId === 'kinetix-class-log';
      const vol = isClass ? 8000 : weight * reps;

      const current = map.get(dateKey) || { maxWeight: 0, tonnage: 0, sets: 0, reps: 0 };
      current.maxWeight = Math.max(current.maxWeight, weight);
      current.tonnage += vol;
      current.sets += 1;
      current.reps += reps;
      map.set(dateKey, current);
    });

    if (map.size === 0) {
      const now = new Date();
      return Array.from({ length: 5 }).map((_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (4 - i) * 2);
        const str = d.toISOString().split('T')[0];
        return {
          date: str,
          displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
          maxWeight: 0,
          tonnage: 0,
          totalSets: 0,
          totalReps: 0
        };
      });
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, val]) => {
        const parts = date.split('-');
        return {
          date,
          displayDate: `${parts[2]}/${parts[1]}`,
          maxWeight: Math.round(val.maxWeight * 10) / 10,
          tonnage: Math.round(val.tonnage),
          totalSets: val.sets,
          totalReps: val.reps
        };
      });
  }, [logs, athleteId]);

  const totalCumulativeTonnage = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.tonnage, 0),
    [chartData]
  );

  const peakMaxWeight = useMemo(
    () => Math.max(...chartData.map(d => d.maxWeight), 0),
    [chartData]
  );

  const latestMaxWeight = useMemo(() => {
    const withWeight = [...chartData].reverse().find(d => d.maxWeight > 0);
    return withWeight ? withWeight.maxWeight : 0;
  }, [chartData]);

  const peakSessionTonnage = useMemo(
    () => Math.max(...chartData.map(d => d.tonnage), 0),
    [chartData]
  );

  return (
    <div className="bg-[#0F0F11] rounded-[36px] border border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.25em]">
              {chartMode === 'maxWeight' ? 'Progresión de Fuerza (Carga Top)' : 'Volumen Acumulado (Tonelaje)'}
            </p>
          </div>
          {chartMode === 'maxWeight' ? (
            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">
              {latestMaxWeight > 0 ? `${latestMaxWeight} KG` : '0 KG'}{' '}
              <span className="text-sm text-white/40 not-italic font-bold">ÚLTIMA CARGA MÁX</span>
            </h3>
          ) : (
            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">
              {totalCumulativeTonnage.toLocaleString()}{' '}
              <span className="text-sm text-white/40 not-italic font-bold">KG VOLUMEN 14D</span>
            </h3>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-black/60 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setChartMode('maxWeight')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                chartMode === 'maxWeight' ? 'bg-cyan-500 text-black' : 'text-white/50 hover:text-white'
              }`}
            >
              Peso Máx
            </button>
            <button
              type="button"
              onClick={() => setChartMode('tonnage')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                chartMode === 'tonnage' ? 'bg-red-600 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              Volumen Total
            </button>
          </div>

          <div className="text-left sm:text-right bg-black/40 px-4 py-2 rounded-2xl border border-white/5">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">
              {chartMode === 'maxWeight' ? 'Récord Periodo' : 'Pico Sesión'}
            </p>
            <p className="text-sm font-black text-red-500 italic">
              {chartMode === 'maxWeight' ? `${peakMaxWeight} KG` : `${peakSessionTonnage.toLocaleString()} KG`}
            </p>
          </div>
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="crimsonGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartMode === 'maxWeight' ? '#06B6D4' : '#FF0000'} stopOpacity={0.55} />
                <stop offset="60%" stopColor={chartMode === 'maxWeight' ? '#0891B2' : '#DC2626'} stopOpacity={0.2} />
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
            <Tooltip content={<CustomTooltip mode={chartMode} />} />
            <Area 
              type="monotone" 
              dataKey={chartMode} 
              stroke={chartMode === 'maxWeight' ? '#06B6D4' : '#FF0000'} 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#crimsonGradient)" 
              dot={{ stroke: chartMode === 'maxWeight' ? '#06B6D4' : '#FF0000', strokeWidth: 2, fill: '#050507', r: 4 }}
              activeDot={{ r: 6, fill: chartMode === 'maxWeight' ? '#06B6D4' : '#FF0000', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-white/5 text-[8px] font-black uppercase text-white/30 tracking-widest">
        <span>
          {chartMode === 'maxWeight'
            ? 'Peso máximo levantado en tu serie más pesada del día'
            : 'Fórmula de Volumen: Σ (Series × Reps × Peso)'}
        </span>
        <span>Últimas 14 Sesiones</span>
      </div>
    </div>
  );
};
