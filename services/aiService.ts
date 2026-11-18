import { PRRecord, User, WorkoutLog } from '../types/kinetix';

export interface CoachDirectiveResult {
  headline: string;
  primaryDirective: string;
  loadAdjustment: string;
  recoveryAlert: string;
  suggestions: string[];
  model: string;
  generatedAt: string;
  historyHash: string;
  source: 'gemini' | 'cache' | 'local';
}

export interface HistoryDigest {
  athleteName: string;
  goal: string;
  level: string;
  daysPerWeek: number;
  sessionsCount: number;
  avgRpe: number | null;
  avgFatigue: number | null;
  totalTonnageKg: number;
  daysSinceLastWorkout: number | null;
  topPRs: Array<{ exercise: string; weightKg: number; reps: number; est1RM: number }>;
  recentSessions: Array<{ date: string; workout: string; rpe?: number; fatigue?: number; sets: number; tonnageKg: number }>;
  historyHash: string;
}

const DIRECTIVE_CACHE_PREFIX = 'kinetix_coach_directive_v2_';
const AUTO_SYNC_KEY = 'kinetix_gemini_auto_sync';

class AiService {
  private inflight = new Map<string, Promise<CoachDirectiveResult>>();
  private cachedHealth: { geminiConfigured: boolean; model: string; checkedAt: number } | null = null;

  getAutoSyncEnabled(): boolean {
    try {
      const val = localStorage.getItem(AUTO_SYNC_KEY);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  }

  setAutoSyncEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(AUTO_SYNC_KEY, enabled ? 'true' : 'false');
    } catch {
      // Ignore storage error
    }
  }

  async checkServerHealth(force = false): Promise<{ geminiConfigured: boolean; model: string }> {
    if (!force && this.cachedHealth && Date.now() - this.cachedHealth.checkedAt < 60_000) {
      return { geminiConfigured: this.cachedHealth.geminiConfigured, model: this.cachedHealth.model };
    }
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return { geminiConfigured: false, model: 'gemini-4-hydrogen' };
      const data = await res.json();
      this.cachedHealth = {
        geminiConfigured: !!data.geminiConfigured,
        model: data.model || 'gemini-4-hydrogen',
        checkedAt: Date.now()
      };
      return { geminiConfigured: this.cachedHealth.geminiConfigured, model: this.cachedHealth.model };
    } catch {
      return { geminiConfigured: false, model: 'gemini-4-hydrogen' };
    }
  }

  buildHistoryDigest(athlete: User, allLogs: WorkoutLog[], allPRs: PRRecord[]): HistoryDigest {
    const athLogs = allLogs
      .filter((l) => l.athleteId === athlete.id)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const sessionMap = new Map<string, {
      date: string;
      workout: string;
      rpe?: number;
      fatigue?: number;
      sets: number;
      tonnageKg: number;
    }>();

    athLogs.forEach((l) => {
      const dateKey = (l.timestamp || '').split('T')[0] || 'sin-fecha';
      const wKey = l.workoutId || 'session';
      const key = `${dateKey}|${wKey}`;
      const prev = sessionMap.get(key) || {
        date: dateKey,
        workout: l.workoutName || 'Sesión Kinetix',
        sets: 0,
        tonnageKg: 0
      };
      prev.sets += 1;
      prev.tonnageKg += Math.round((Number(l.weight) || 0) * (Number(l.reps) || 0));
      if (l.feedback?.rpe && !prev.rpe) prev.rpe = l.feedback.rpe;
      if (l.feedback?.fatigue && !prev.fatigue) prev.fatigue = l.feedback.fatigue;
      sessionMap.set(key, prev);
    });

    const recentSessions = Array.from(sessionMap.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);

    const rpeValues = recentSessions.map((s) => s.rpe).filter((v): v is number => typeof v === 'number' && v > 0);
    const fatigueValues = recentSessions.map((s) => s.fatigue).filter((v): v is number => typeof v === 'number' && v > 0);

    const avgRpe = rpeValues.length > 0
      ? Math.round((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10) / 10
      : null;
    const avgFatigue = fatigueValues.length > 0
      ? Math.round((fatigueValues.reduce((a, b) => a + b, 0) / fatigueValues.length) * 10) / 10
      : null;

    const totalTonnageKg = recentSessions.reduce((a, b) => a + b.tonnageKg, 0);
    const latestTs = athLogs[0]?.timestamp;
    const daysSinceLastWorkout = latestTs
      ? Math.max(0, Math.floor((Date.now() - new Date(latestTs).getTime()) / 86400000))
      : null;

    const topPRs = allPRs
      .slice()
      .sort((a, b) => b.estimated1RM - a.estimated1RM)
      .slice(0, 4)
      .map((p) => ({
        exercise: p.exerciseName,
        weightKg: p.weight,
        reps: p.reps,
        est1RM: p.estimated1RM
      }));

    const historyHash = [
      athlete.id,
      sessionMap.size,
      athLogs.length,
      latestTs || 'none',
      avgRpe ?? 'na',
      athlete.goal
    ].join('|');

    return {
      athleteName: athlete.name,
      goal: athlete.goal,
      level: athlete.level,
      daysPerWeek: athlete.daysPerWeek || 4,
      sessionsCount: sessionMap.size,
      avgRpe,
      avgFatigue,
      totalTonnageKg,
      daysSinceLastWorkout,
      topPRs,
      recentSessions,
      historyHash
    };
  }

  getDeterministicBaseline(digest: HistoryDigest): CoachDirectiveResult {
    const { avgRpe, avgFatigue, daysSinceLastWorkout, sessionsCount, goal } = digest;

    if (sessionsCount === 0) {
      return {
        headline: 'Fase Base · Sin Historial Previo',
        primaryDirective: 'Prioriza técnica limpia, velocidad controlada 3-0-1-0 y deja 2-3 repeticiones en recámara (RIR 2-3).',
        loadAdjustment: 'Cargas moderadas de calibración en las primeras 2 semanas para establecer línea base real.',
        recoveryAlert: 'Sin sesiones registradas aún. Ideal para evaluar movilidad y técnica en sede.',
        suggestions: [
          'Registra cada serie y tu RPE real al finalizar para calibrar progresiones.',
          `Alinea el volumen inicial a ${digest.daysPerWeek} días/semana según objetivo (${goal}).`
        ],
        model: 'Motor Kinetix Offline (0 tokens)',
        generatedAt: new Date().toISOString(),
        historyHash: digest.historyHash,
        source: 'local'
      };
    }

    if ((avgRpe !== null && avgRpe >= 8.5) || (avgFatigue !== null && avgFatigue >= 4)) {
      return {
        headline: 'Control de Fatiga · Ajuste Preventivo',
        primaryDirective: 'Mantén RIR 2-3 hoy, respeta descansos completos de 120s y evita llegar al fallo en compuestos.',
        loadAdjustment: 'Reduce 5-10% la carga o recorta 1 serie en ejercicios accesorios si notas pesadez articular.',
        recoveryAlert: `RPE promedio reciente @${avgRpe ?? '-'} y fatiga ${avgFatigue ?? '-'}/5.`,
        suggestions: [
          'Prioriza calidad de sueño (7.5h+) e hidratación antes de la próxima sesión.',
          'Evalúa una semana de descarga si el RPE se sostiene >= 9 en la siguiente sesión.'
        ],
        model: 'Motor Kinetix Offline (0 tokens)',
        generatedAt: new Date().toISOString(),
        historyHash: digest.historyHash,
        source: 'local'
      };
    }

    if (daysSinceLastWorkout !== null && daysSinceLastWorkout >= 4) {
      return {
        headline: `Reanudación Tras ${daysSinceLastWorkout} Días`,
        primaryDirective: 'Realiza 2 series de aproximación extra antes de tus series efectivas y cuida la profundidad técnica.',
        loadAdjustment: 'Inicia al 90% de tu última carga registrada y progresa según sensaciones.',
        recoveryAlert: `${daysSinceLastWorkout} días desde el último entrenamiento registrado.`,
        suggestions: [
          'Activa estabilidad de core y movilidad articular durante 8 min previos.',
          'Evita cambios bruscos de volumen hoy para prevenir agujetas excesivas.'
        ],
        model: 'Motor Kinetix Offline (0 tokens)',
        generatedAt: new Date().toISOString(),
        historyHash: digest.historyHash,
        source: 'local'
      };
    }

    return {
      headline: 'Progresión Óptima · Listo para Sobrecarga',
      primaryDirective: 'Ejecuta excéntrica controlada y busca +2.5 kg o +1 rep limpia manteniendo técnica sólida.',
      loadAdjustment: `Ritmo estable (${sessionsCount} sesiones · ${digest.totalTonnageKg.toLocaleString()} kg acumulados).`,
      recoveryAlert: `Adherencia positiva (RPE promedio @${avgRpe ?? 7}). Continúa con el bloque actual.`,
      suggestions: [
        'Sube carga progresiva únicamente si completaste todas las reps objetivo con RIR >= 1.',
        `Mantén foco específico hacia tu meta de ${goal}.`
      ],
      model: 'Motor Kinetix Offline (0 tokens)',
      generatedAt: new Date().toISOString(),
      historyHash: digest.historyHash,
      source: 'local'
    };
  }

  getCachedDirective(athleteId: string): CoachDirectiveResult | null {
    try {
      const raw = localStorage.getItem(`${DIRECTIVE_CACHE_PREFIX}${athleteId}`);
      return raw ? (JSON.parse(raw) as CoachDirectiveResult) : null;
    } catch {
      return null;
    }
  }

  saveCachedDirective(athleteId: string, result: CoachDirectiveResult): void {
    try {
      localStorage.setItem(`${DIRECTIVE_CACHE_PREFIX}${athleteId}`, JSON.stringify(result));
    } catch {
      // Ignore quota error
    }
  }

  async generateCoachDirective(
    athlete: User,
    allLogs: WorkoutLog[],
    allPRs: PRRecord[],
    forceRefresh = false
  ): Promise<CoachDirectiveResult> {
    const digest = this.buildHistoryDigest(athlete, allLogs, allPRs);
    const cached = this.getCachedDirective(athlete.id);

    if (!forceRefresh && cached && cached.historyHash === digest.historyHash) {
      return { ...cached, source: 'cache' };
    }

    const existingPromise = this.inflight.get(athlete.id);
    if (existingPromise) return existingPromise;

    const reqPromise = (async (): Promise<CoachDirectiveResult> => {
      try {
        const res = await fetch('/api/coach-directive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(digest)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || `Error HTTP ${res.status} al consultar Gemini.`);
        }
        const finalResult: CoachDirectiveResult = {
          headline: String(data.headline || 'Directriz Táctica Kinetix'),
          primaryDirective: String(data.primaryDirective || ''),
          loadAdjustment: String(data.loadAdjustment || ''),
          recoveryAlert: String(data.recoveryAlert || ''),
          suggestions: Array.isArray(data.suggestions) ? data.suggestions.map(String) : [],
          model: String(data.model || 'gemini-4-hydrogen'),
          generatedAt: String(data.generatedAt || new Date().toISOString()),
          historyHash: digest.historyHash,
          source: 'gemini'
        };
        this.saveCachedDirective(athlete.id, finalResult);
        return finalResult;
      } finally {
        this.inflight.delete(athlete.id);
      }
    })();

    this.inflight.set(athlete.id, reqPromise);
    return reqPromise;
  }
}

export const aiService = new AiService();