import React, { useState } from 'react';
import { toLbs, toKg } from '../../lib/units';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialValue?: number;
}

export const UnitConverterModal: React.FC<Props> = ({ isOpen, onClose, initialValue }) => {
  const [val, setVal] = useState<string>(initialValue !== undefined ? String(initialValue) : '80');
  const [mode, setMode] = useState<'kg_to_lbs' | 'lbs_to_kg'>('kg_to_lbs');

  if (!isOpen) return null;

  const num = parseFloat(val) || 0;
  const converted = mode === 'kg_to_lbs' ? toLbs(num) : toKg(num);

  const quickValues = mode === 'kg_to_lbs' ? [20, 40, 60, 80, 100, 140] : [45, 90, 135, 185, 225, 315];

  return (
    <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0F0F11] border border-cyan-500/40 w-full max-w-sm rounded-[32px] p-6 shadow-[0_0_50px_rgba(0,240,255,0.2)] space-y-6 relative">
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚖️</span>
            <div>
              <h3 className="text-sm font-black uppercase italic tracking-wider text-white">Convertidor de Carga</h3>
              <p className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest">Barras • Discos • Mancuernas</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 text-white flex items-center justify-center font-bold text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Toggle Modo */}
        <div className="flex bg-black p-1 rounded-2xl border border-white/10 gap-1">
          <button 
            onClick={() => setMode('kg_to_lbs')}
            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${mode === 'kg_to_lbs' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-white/40 hover:text-white'}`}
          >
            Kilogramos ➔ Libras (KG ➔ LBS)
          </button>
          <button 
            onClick={() => setMode('lbs_to_kg')}
            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${mode === 'lbs_to_kg' ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30' : 'text-white/40 hover:text-white'}`}
          >
            Libras ➔ Kilogramos (LBS ➔ KG)
          </button>
        </div>

        {/* Display Central */}
        <div className="bg-black/80 border border-white/10 rounded-3xl p-5 text-center space-y-3">
          <label className="text-[8px] font-black uppercase text-white/30 tracking-[0.3em] block">
            {mode === 'kg_to_lbs' ? 'Peso en Kilogramos (KG)' : 'Peso en Libras (LBS)'}
          </label>
          <div className="flex items-center justify-center gap-2">
            <input 
              type="number" 
              value={val} 
              onChange={e => setVal(e.target.value)}
              step="0.5"
              className="w-32 bg-transparent text-4xl font-black italic text-center text-white outline-none border-b-2 border-cyan-400 focus:border-red-500 transition-colors" 
              autoFocus
            />
            <span className="text-xs font-black uppercase text-white/40">
              {mode === 'kg_to_lbs' ? 'KG' : 'LBS'}
            </span>
          </div>

          <div className="pt-2 border-t border-white/5 flex flex-col items-center">
            <span className="text-[8px] font-black uppercase text-cyan-400 tracking-widest">Equivalencia Exacta</span>
            <p className="text-3xl font-black italic text-cyan-300 drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              {converted} <span className="text-sm uppercase">{mode === 'kg_to_lbs' ? 'LBS' : 'KG'}</span>
            </p>
          </div>
        </div>

        {/* Quick Buttons */}
        <div className="space-y-1.5">
          <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">Pesos de Referencia Rápida</p>
          <div className="grid grid-cols-6 gap-1.5">
            {quickValues.map(q => (
              <button 
                key={q} 
                onClick={() => setVal(q.toString())}
                className="py-2 bg-white/5 hover:bg-white text-white hover:text-black rounded-xl text-[9px] font-black transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-3 bg-white/5 hover:bg-white hover:text-black rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
