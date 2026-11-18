import React, { useState, useEffect } from 'react';

interface QuickNotesProps {
  exerciseId: string;
  exerciseName: string;
  value: string;
  previousNote?: string;
  onChange: (note: string) => void;
  onSaveToCloud: (note: string) => Promise<{ ok: boolean; error?: string }>;
}

const ATHLETE_QUICK_TAGS: Array<{ label: string; text: string }> = [
  { label: 'Hombro firme', text: 'Mantener el hombro firme y abajo' },
  { label: 'Cuidar postura', text: 'Cuidar postura lumbar y core activo' },
  { label: 'Bajada lenta 3s', text: 'Bajada controlada en 3 segundos' },
  { label: 'Subir peso próx.', text: 'Listo para subir peso en la próxima sesión' },
  { label: 'Molestia leve', text: 'Molestia leve articular, vigilar rango' },
  { label: 'Técnica sólida', text: 'Técnica limpia y control completo' }
];

export const QuickNotes: React.FC<QuickNotesProps> = ({
  exerciseId,
  exerciseName,
  value,
  previousNote,
  onChange,
  onSaveToCloud
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(!!value.trim());
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setSavedFeedback(null);
    if (value.trim()) setIsOpen(true);
  }, [exerciseId]);

  const handleToggleTag = (tagText: string) => {
    const clean = value.trim();
    if (!clean) {
      onChange(tagText);
      return;
    }
    if (clean.toLowerCase().includes(tagText.toLowerCase())) return;
    const next = `${clean} · ${tagText}`.slice(0, 160);
    onChange(next);
  };

  const handleSave = async () => {
    const clean = value.trim();
    if (!clean) return;
    setSaving(true);
    setSavedFeedback(null);
    const res = await onSaveToCloud(clean);
    setSaving(false);
    if (res.ok) {
      setSavedFeedback({ ok: true, text: 'Nota guardada en Supabase' });
    } else {
      setSavedFeedback({ ok: false, text: res.error || 'Guardada localmente (pendiente nube)' });
    }
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  return (
    <div className="bg-black/45 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(o => !o)}
          className="flex items-center gap-2 text-left min-w-0"
        >
          <span className="text-xs">📝</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 truncate">
            Notas Rápidas · {exerciseName}
          </span>
          {value.trim() && !isOpen && (
            <span className="text-[10px] text-white/60 truncate max-w-[140px]">— {value.trim()}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(o => !o)}
          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-wider text-white/60 hover:text-white shrink-0 transition-all"
        >
          {isOpen ? 'Ocultar' : value.trim() ? 'Editar' : '+ Anotar'}
        </button>
      </div>

      {previousNote && previousNote.trim() !== value.trim() && (
        <div className="text-[10px] text-white/55 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
          <span className="truncate">
            <strong className="text-cyan-400 uppercase text-[9px]">Sesión previa:</strong> {previousNote}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(previousNote);
              setIsOpen(true);
            }}
            className="text-[9px] font-black uppercase text-cyan-300 hover:text-white shrink-0"
          >
            Reusar
          </button>
        </div>
      )}

      {isOpen && (
        <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
          <div className="flex flex-wrap gap-1.5">
            {ATHLETE_QUICK_TAGS.map(tag => {
              const active = value.toLowerCase().includes(tag.text.toLowerCase());
              return (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => handleToggleTag(tag.text)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50'
                      : 'bg-white/5 hover:bg-white/10 text-white/65 hover:text-white border-white/10'
                  }`}
                >
                  + {tag.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              maxLength={160}
              value={value}
              onChange={e => onChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder="Ej: Mantener el hombro firme, cuidar postura..."
              className="flex-1 bg-black/70 border border-white/15 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none"
            />
            <div className="flex items-center gap-1.5 shrink-0">
              {value.trim() && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-[9px] font-black uppercase text-white/45 hover:text-white"
                  title="Borrar nota"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                disabled={!value.trim() || saving}
                onClick={handleSave}
                className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-35 text-white text-[9px] font-black uppercase tracking-wider transition-all"
              >
                {saving ? 'Guardando...' : '💾 Guardar Nota'}
              </button>
            </div>
          </div>

          {savedFeedback && (
            <p className={`text-[10px] font-bold ${savedFeedback.ok ? 'text-emerald-400' : 'text-amber-300'}`}>
              {savedFeedback.ok ? '✓' : 'ℹ️'} {savedFeedback.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
