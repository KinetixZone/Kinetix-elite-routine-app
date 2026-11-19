
import { User, Workout, WorkoutLog, Exercise, BodyMetric, Goal, UserLevel, WorkoutExercise, PRRecord } from '../types/kinetix';
import { EXERCISES_DB } from '../constants/exercises';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const KEYS = {
  USER: 'kinetix_user',
  WORKOUT_TEMPLATES: 'kinetix_templates', 
  CURRENT_WORKOUT: 'kinetix_current_active',
  CALENDAR: 'kinetix_calendar',
  SETTINGS: 'kinetix_settings',
  PRS: 'kinetix_personal_records',
  LOG_HISTORY: 'kinetix_workout_history',
  CUSTOM_WORKOUTS: 'kinetix_custom_workouts',
  COMPLETED_SESSIONS: 'kinetix_completed_sessions_ids',
  EXERCISE_LIBRARY: 'kinetix_exercise_library_v3',
  ATHLETES_DB: 'kinetix_athletes_db',
  STAFF_DB: 'kinetix_staff_db',
  BODY_METRICS: 'kinetix_body_metrics',
  AI_PROMPT_HISTORY: 'kinetix_ai_prompts',
  AI_BLUEPRINTS: 'kinetix_ai_blueprints',
  SYSTEM_CONFIG: 'kinetix_system_config',
  BRANDING: 'kinetix_branding'
};

export interface AiBlueprint {
    id: string;
    title: string;
    prompt: string;
    tags: string[];
    dateCreated: string;
}

export interface BrandingConfig {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    brandName?: string;
    payPortalUrl?: string;
    bankName?: string;
    bankHolder?: string;
    bankClabe?: string;
    bankAccount?: string;
    bankConceptNote?: string;
    whatsappReceipts?: string;
    customMasterKey?: string;
}

export interface MuscleStatus {
  zone: string;
  status: 'fatigued' | 'recovering' | 'optimal';
  level: number;
}

export interface AthleteInsight {
  athleteId?: string;
  athleteName: string;
  message: string;
  status: 'critical' | 'warning' | 'normal';
  compliance: number;
  lastRpe?: number;
  lastWorkoutDate?: string;
}

export interface IntegrityFinding {
  id: string;
  source: 'localStorage' | 'Supabase';
  category: 'trash_session' | 'orphan_exercise' | 'orphan_calendar' | 'stale_30d';
  label: string;
  detail: string;
  date?: string;
}

export interface IntegrityScanReport {
  scannedAt: string;
  cutoff30d: string;
  cloudChecked: boolean;
  localStats: {
    templatesCount: number;
    logsCount: number;
    calendarCount: number;
    exercisesCount: number;
    usedKB: number;
  };
  cloudStats?: {
    templatesCount: number;
    logsCount: number;
    calendarCount: number;
    athletesCount: number;
  };
  trashSessionsCount: number;
  orphanExercisesCount: number;
  orphanCalendarCount: number;
  stale30dCount: number;
  findings: IntegrityFinding[];
  cleanableTemplateIds: string[];
  cleanableCalendarIds: string[];
  cleanableCloudLogIds: string[];
  cleanableLocalKeys: string[];
}

export interface IntegrityCleanResult {
  removedTemplates: number;
  removedCalendarEvents: number;
  removedCloudLogs: number;
  removedLocalLogs: number;
  removedLocalKeys: number;
  cloudSynced: boolean;
}

import { PRESET_WORKOUT_TEMPLATES } from '../constants/presetWorkouts';

export const generateUsernameFromName = (name: string): string => {
  const clean = (name || 'atleta')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('.');
  return clean || `atleta.${Math.floor(100 + Math.random() * 900)}`;
};

const DEFAULT_ATHLETES: User[] = [
  {
    id: 'ath-1',
    name: 'Carlos Rodríguez',
    username: 'carlos',
    email: 'carlos@kinetix.com',
    password: 'kinetix.atleta',
    role: 'client',
    accessTier: 'regular',
    isUnlimited: false,
    goal: Goal.PERFORMANCE,
    level: UserLevel.ADVANCED,
    daysPerWeek: 4,
    equipment: ['Barra', 'Mancuernas', 'Poleas', 'Banca'],
    streak: 12,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    isActive: true,
    cycleEndDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    age: 27,
    weight: 78,
    medicalConditions: 'Kinetix Presencial'
  },
  {
    id: 'ath-2',
    name: 'Ana García (Personalizada Jorge)',
    username: 'ana',
    email: 'ana@kinetix.com',
    password: 'kinetix.atleta',
    role: 'client',
    accessTier: 'personalizado',
    isUnlimited: false,
    goal: Goal.GAIN_MUSCLE,
    level: UserLevel.INTERMEDIATE,
    daysPerWeek: 4,
    equipment: ['Barra', 'Mancuernas', 'Poleas'],
    streak: 8,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    isActive: true,
    cycleEndDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
    age: 24,
    weight: 62,
    medicalConditions: 'Personalizado Jorge Gonzalez'
  },
  {
    id: 'ath-3',
    name: 'Diego Morales (Modo Vacaciones / Hotel)',
    username: 'diego',
    email: 'diego@kinetix.com',
    password: 'kinetix.atleta',
    role: 'client',
    accessTier: 'vacaciones',
    isUnlimited: false,
    goal: Goal.PERFORMANCE,
    level: UserLevel.INTERMEDIATE,
    daysPerWeek: 3,
    equipment: ['Hotel Gym', 'Mancuernas'],
    streak: 5,
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    isActive: true,
    cycleEndDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    age: 31,
    weight: 81,
    medicalConditions: 'Remoto / Vacaciones'
  }
];

class StorageService {
  getBranding(): BrandingConfig {
      const defaultBranding: BrandingConfig = {
          logoUrl: '/assets/aistudio/1759185151992_02f8a860.jpg',
          primaryColor: '#FF2A2A',
          secondaryColor: '#00F0FF',
          brandName: 'KINETIX FUNCTIONAL ZONE',
          payPortalUrl: 'https://kinetix-progress.vercel.app/',
          bankName: '',
          bankHolder: 'Leslie Barrera / Kinetix Functional Zone',
          bankClabe: '',
          bankAccount: '',
          bankConceptNote: 'Nombre Completo + Mensualidad Kinetix',
          whatsappReceipts: '525627303189'
      };
      try {
          const data = localStorage.getItem(KEYS.BRANDING);
          if (!data) return defaultBranding;
          const parsed = JSON.parse(data);
          return {
              ...defaultBranding,
              ...parsed,
              logoUrl: parsed.logoUrl || defaultBranding.logoUrl,
              payPortalUrl: defaultBranding.payPortalUrl
          };
      } catch (e) { return defaultBranding; }
  }

  saveBranding(config: BrandingConfig) {
      localStorage.setItem(KEYS.BRANDING, JSON.stringify(config));
      if (isSupabaseConfigured) {
        try {
          void supabase.from('kinetix_templates').upsert({
            id: '__kinetix_sys_branding__',
            name: 'Kinetix Branding Config',
            publicTitle: config.brandName || 'KINETIX FUNCTIONAL ZONE',
            category: 'system_config',
            day: 0,
            exercises: [config] as any,
            isCompleted: true,
            scheduledDate: null,
            isTemplate: false,
            assignedTo: '__system__',
            location: 'system'
          });
        } catch {}
      }
  }

  async syncBrandingFromCloud(): Promise<BrandingConfig> {
      const local = this.getBranding();
      if (!isSupabaseConfigured) return local;
      try {
        const { data, error } = await supabase
          .from('kinetix_templates')
          .select('exercises')
          .eq('id', '__kinetix_sys_branding__')
          .maybeSingle();
        if (!error && data && Array.isArray((data as any).exercises) && (data as any).exercises[0]) {
          const cloudCfg = (data as any).exercises[0] as BrandingConfig;
          const merged = { ...local, ...cloudCfg };
          localStorage.setItem(KEYS.BRANDING, JSON.stringify(merged));
          return merged;
        }
      } catch {}
      return local;
  }

  private cachedServerDate: { date: string; fetchedAt: number } | null = null;
  private readonly TEMPLATES_META_KEY = 'kinetix_templates_meta_v1';
  private readonly TEMPLATES_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas
  private readonly BACKGROUND_REVALIDATE_COOLDOWN_MS = 20_000;
  private templatesInflight = new Map<string, Promise<Workout[]>>();
  private lastBgRevalidateAt = new Map<string, number>();

  getSystemConfig() {
      try {
          const data = localStorage.getItem(KEYS.SYSTEM_CONFIG);
          return data ? JSON.parse(data) : { enableAI: false, enableCloud: true };
      } catch {
          return { enableAI: false, enableCloud: true };
      }
  }

  saveUser(user: User) { localStorage.setItem(KEYS.USER, JSON.stringify(user)); }
  getUser(): User | null {
    try {
      const data = localStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  logout() {
    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.WORKOUT_TEMPLATES);
    localStorage.removeItem(this.TEMPLATES_META_KEY);
    localStorage.removeItem(KEYS.CALENDAR);
  }

  getAthletes(): User[] {
    const data = localStorage.getItem(KEYS.ATHLETES_DB);
    if (!data) {
      localStorage.setItem(KEYS.ATHLETES_DB, JSON.stringify(DEFAULT_ATHLETES));
      return DEFAULT_ATHLETES;
    }
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ATHLETES;
    } catch (e) {
      return DEFAULT_ATHLETES;
    }
  }

  saveAthletes(athletes: User[]) {
    localStorage.setItem(KEYS.ATHLETES_DB, JSON.stringify(athletes));
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      name: row.name,
      username: row.username || generateUsernameFromName(row.name),
      email: row.email || `${row.username || row.id}@kinetix.local`,
      phone: row.phone || '',
      password: row.password || 'kinetix.atleta',
      goal: (row.goal as Goal) || Goal.PERFORMANCE,
      level: (row.level as UserLevel) || UserLevel.BEGINNER,
      role: row.role || 'client',
      daysPerWeek: row.days_per_week ?? 4,
      equipment: Array.isArray(row.equipment) ? row.equipment : [],
      isActive: row.is_active !== false,
      isUnlimited: !!row.is_unlimited || row.role === 'coach' || row.role === 'owner',
      accessTier: row.access_tier || (row.is_unlimited ? 'vip_sin_corte' : 'regular'),
      streak: row.streak ?? 0,
      cycleEndDate: row.cycle_end_date || undefined,
      age: row.age ?? undefined,
      weight: row.weight ?? undefined,
      medicalConditions: row.medical_conditions || '',
      coachNote: row.coach_notes || '',
      preferredUnit: row.preferred_unit || 'kg',
      createdAt: row.created_at || new Date().toISOString()
    };
  }

  async syncAthletesFromCloud(): Promise<User[]> {
    const localList = this.getAthletes();
    if (!isSupabaseConfigured) return localList;
    try {
      const { data, error } = await supabase.from('athletes').select('*');
      if (error || !data) return localList;
      const cloudUsers = data.map(row => this.mapRowToUser(row));
      if (cloudUsers.length === 0) return localList;

      const mergedMap = new Map<string, User>();
      localList.forEach(u => mergedMap.set(u.id, u));
      cloudUsers.forEach(cu => {
        const existing = mergedMap.get(cu.id);
        mergedMap.set(cu.id, existing ? { ...existing, ...cu } : cu);
      });
      const merged = Array.from(mergedMap.values());
      this.saveAthletes(merged);
      return merged;
    } catch (e) {
      console.warn('Supabase syncAthletes fallback', e);
      return localList;
    }
  }

  async upsertAthleteCloud(user: User): Promise<{ ok: boolean; error?: string }> {
    const normalizedUser: User = {
      ...user,
      username: (user.username || generateUsernameFromName(user.name)).trim().toLowerCase(),
      email: (user.email || `${(user.username || generateUsernameFromName(user.name)).trim().toLowerCase()}@kinetix.local`).trim().toLowerCase(),
      password: (user.password || 'kinetix.atleta').trim()
    };

    const list = this.getAthletes();
    const exists = list.some(a => a.id === normalizedUser.id);
    const updatedList = exists
      ? list.map(a => a.id === normalizedUser.id ? normalizedUser : a)
      : [...list, normalizedUser];
    this.saveAthletes(updatedList);

    const currentUser = this.getUser();
    if (currentUser && currentUser.id === normalizedUser.id) {
      this.saveUser(normalizedUser);
    }

    if (!isSupabaseConfigured) return { ok: true };

    const fullPayload = {
      id: normalizedUser.id,
      name: normalizedUser.name,
      username: normalizedUser.username,
      email: normalizedUser.email,
      password: normalizedUser.password,
      goal: normalizedUser.goal,
      level: normalizedUser.level,
      role: normalizedUser.role,
      days_per_week: normalizedUser.daysPerWeek || 4,
      equipment: normalizedUser.equipment || [],
      is_active: normalizedUser.isActive !== false,
      is_unlimited: !!normalizedUser.isUnlimited,
      access_tier: normalizedUser.accessTier || (normalizedUser.isUnlimited ? 'vip_sin_corte' : 'regular'),
      streak: normalizedUser.streak || 0,
      cycle_end_date: normalizedUser.cycleEndDate || null,
      age: normalizedUser.age || null,
      weight: normalizedUser.weight || null,
      medical_conditions: normalizedUser.medicalConditions || '',
      coach_notes: normalizedUser.coachNote || '',
      preferred_unit: normalizedUser.preferredUnit || 'kg'
    };

    try {
      const { error } = await supabase.from('athletes').upsert(fullPayload);
      if (error) {
        // Fallback seguro si la columna coach_notes o v7.3 aún no se ejecuta en Supabase
        const v73Payload = {
          id: normalizedUser.id,
          name: normalizedUser.name,
          username: normalizedUser.username,
          email: normalizedUser.email,
          password: normalizedUser.password,
          goal: normalizedUser.goal,
          level: normalizedUser.level,
          role: normalizedUser.role,
          days_per_week: normalizedUser.daysPerWeek || 4,
          equipment: normalizedUser.equipment || [],
          is_active: normalizedUser.isActive !== false,
          is_unlimited: !!normalizedUser.isUnlimited,
          access_tier: normalizedUser.accessTier || (normalizedUser.isUnlimited ? 'vip_sin_corte' : 'regular'),
          streak: normalizedUser.streak || 0,
          cycle_end_date: normalizedUser.cycleEndDate || null,
          age: normalizedUser.age || null,
          weight: normalizedUser.weight || null,
          medical_conditions: normalizedUser.medicalConditions || '',
          preferred_unit: normalizedUser.preferredUnit || 'kg'
        };
        const retry73 = await supabase.from('athletes').upsert(v73Payload);
        if (!retry73.error) return { ok: true };

        const corePayload = {
          id: normalizedUser.id,
          name: normalizedUser.name,
          email: normalizedUser.email,
          goal: normalizedUser.goal,
          level: normalizedUser.level,
          role: normalizedUser.role,
          days_per_week: normalizedUser.daysPerWeek || 4,
          equipment: normalizedUser.equipment || [],
          is_active: normalizedUser.isActive !== false,
          streak: normalizedUser.streak || 0,
          cycle_end_date: normalizedUser.cycleEndDate || null
        };
        const retry = await supabase.from('athletes').upsert(corePayload);
        if (retry.error) return { ok: false, error: retry.error.message };
        return { ok: true, error: 'Actualiza el SQL en Sistema para sincronizar notas y claves en todos los dispositivos.' };
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Error de red Supabase' };
    }
  }

  async deleteAthleteCloud(athleteId: string): Promise<void> {
    const filtered = this.getAthletes().filter(a => a.id !== athleteId);
    this.saveAthletes(filtered);
    if (isSupabaseConfigured) {
      try {
        await supabase.from('athletes').delete().eq('id', athleteId);
      } catch (e) {
        console.warn('Error deleting athlete in cloud', e);
      }
    }
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
    const pwd = newPassword.trim();
    if (!pwd || pwd.length < 4) return { ok: false, error: 'La contraseña debe tener al menos 4 caracteres.' };
    const athletes = this.getAthletes();
    const target = athletes.find(a => a.id === userId);
    if (target) {
      return this.upsertAthleteCloud({ ...target, password: pwd });
    }
    const current = this.getUser();
    if (current && current.id === userId) {
      this.saveUser({ ...current, password: pwd });
      return { ok: true };
    }
    return { ok: false, error: 'Usuario no encontrado.' };
  }

  getExercises(): Exercise[] {
    const data = localStorage.getItem(KEYS.EXERCISE_LIBRARY);
    if (!data) {
      localStorage.setItem(KEYS.EXERCISE_LIBRARY, JSON.stringify(EXERCISES_DB));
      return EXERCISES_DB;
    }
    try {
      const parsed: Exercise[] = JSON.parse(data);
      const existingMap = new Map(parsed.map(e => [e.id, e]));
      let hasChanges = false;
      EXERCISES_DB.forEach(dbEx => {
        if (!existingMap.has(dbEx.id)) {
          existingMap.set(dbEx.id, dbEx);
          hasChanges = true;
        } else {
          const curr = existingMap.get(dbEx.id)!;
          if ((!curr.videoUrl || curr.videoUrl.trim() === '') && dbEx.videoUrl) {
            curr.videoUrl = dbEx.videoUrl;
            hasChanges = true;
          }
        }
      });
      const merged = Array.from(existingMap.values());
      if (hasChanges) {
        localStorage.setItem(KEYS.EXERCISE_LIBRARY, JSON.stringify(merged));
      }
      return merged;
    } catch (e) {
      return EXERCISES_DB;
    }
  }

  saveExercises(exercises: Exercise[]) { localStorage.setItem(KEYS.EXERCISE_LIBRARY, JSON.stringify(exercises)); }

  private getDeletedTemplateIds(): string[] {
    try {
      return JSON.parse(localStorage.getItem('kinetix_deleted_templates') || '[]');
    } catch { return []; }
  }

  async restorePresetTemplates(): Promise<Workout[]> {
    localStorage.removeItem('kinetix_deleted_templates');
    const current: Workout[] = JSON.parse(localStorage.getItem(KEYS.WORKOUT_TEMPLATES) || '[]');
    const map = new Map<string, Workout>();
    PRESET_WORKOUT_TEMPLATES.forEach(p => map.set(p.id, p));
    current.forEach(t => map.set(t.id, t));
    const merged = Array.from(map.values());
    localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(merged));
    if (isSupabaseConfigured) {
      for (const p of PRESET_WORKOUT_TEMPLATES) {
        try { await supabase.from('kinetix_templates').upsert(p); } catch {}
      }
    }
    return merged;
  }

  async getTemplateByIdCloud(id: string): Promise<Workout | undefined> {
    const isClient = this.getUser()?.role === 'client';
    const serverToday = this.getServerTodayIsoSync();
    const isFutureRestricted = (w?: Workout) =>
      !!(isClient && w?.scheduledDate && String(w.scheduledDate).slice(0, 10) > serverToday);

    const local = this.getWorkoutById(id);
    if (local) return isFutureRestricted(local) ? undefined : local;
    const preset = PRESET_WORKOUT_TEMPLATES.find(p => p.id === id);
    if (preset) return preset;
    if (!isSupabaseConfigured) return undefined;
    try {
      const { data, error } = await supabase.from('kinetix_templates').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        const w = data as Workout;
        if (isFutureRestricted(w)) return undefined;
        const current: Workout[] = JSON.parse(localStorage.getItem(KEYS.WORKOUT_TEMPLATES) || '[]');
        const next = [...current.filter(t => t.id !== w.id), w];
        localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(next));
        return w;
      }
    } catch {}
    return undefined;
  }

  private readTemplatesCacheMeta(): { scope: string; syncedAt: number } | null {
    try {
      const raw = localStorage.getItem(this.TEMPLATES_META_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private writeTemplatesCacheMeta(scope: string) {
    try {
      localStorage.setItem(this.TEMPLATES_META_KEY, JSON.stringify({ scope, syncedAt: Date.now() }));
    } catch {}
  }

  private getLocalTemplatesScoped(athleteId?: string): Workout[] {
    let localTemplates: Workout[] = [];
    try {
      const localData = localStorage.getItem(KEYS.WORKOUT_TEMPLATES);
      if (localData) localTemplates = JSON.parse(localData);
    } catch {
      localTemplates = [];
    }

    if (athleteId) {
      const serverToday = this.getServerTodayIsoSync();
      return localTemplates.filter(
        t =>
          t.assignedTo === athleteId &&
          (!t.scheduledDate || String(t.scheduledDate).slice(0, 10) <= serverToday)
      );
    }

    const deletedIds = new Set(this.getDeletedTemplateIds());
    const cutoff30d = this.getLocalTodayIso(new Date(Date.now() - 30 * 86400000));
    const map = new Map<string, Workout>();
    PRESET_WORKOUT_TEMPLATES.forEach(p => {
      if (!deletedIds.has(p.id)) map.set(p.id, p);
    });
    localTemplates.forEach(t => {
      if (t.id === '__kinetix_sys_branding__' || deletedIds.has(t.id)) return;
      const keepInstance = t.isTemplate !== false || !t.scheduledDate || t.scheduledDate >= cutoff30d;
      if (keepInstance) map.set(t.id, t);
    });
    return Array.from(map.values());
  }

  private async syncTemplatesFromCloud(athleteId?: string): Promise<Workout[]> {
    const scopeKey = athleteId || 'staff';
    const existing = this.templatesInflight.get(scopeKey);
    if (existing) return existing;

    const promise = (async (): Promise<Workout[]> => {
      let cloudTemplates: Workout[] = [];
      const cutoff30d = this.getLocalTodayIso(new Date(Date.now() - 30 * 86400000));

      if (isSupabaseConfigured) {
        try {
          let query = supabase.from('kinetix_templates').select('*');
          if (athleteId) {
            query = query.eq('assignedTo', athleteId);
          } else {
            // Ventana ligera para Coach/Dueños: Plantillas maestras + personalizadas recientes (>= 30 días)
            query = query.or(`isTemplate.eq.true,scheduledDate.gte.${cutoff30d},scheduledDate.is.null`);
          }
          const { data, error } = await query;
          if (!error && data) {
            cloudTemplates = data as Workout[];
          }
        } catch (e) {
          console.warn('Supabase Fetch Error, usando caché local', e);
        }
      }

      const localScoped = this.getLocalTemplatesScoped(athleteId);

      if (athleteId) {
        const serverToday = this.getServerTodayIsoSync();
        const isAllowedForAthlete = (t: Workout) =>
          t.assignedTo === athleteId &&
          (!t.scheduledDate || String(t.scheduledDate).slice(0, 10) <= serverToday);
        const map = new Map<string, Workout>();
        localScoped.filter(isAllowedForAthlete).forEach(t => map.set(t.id, t));
        cloudTemplates.filter(isAllowedForAthlete).forEach(t => map.set(t.id, t));
        const athleteOnly = Array.from(map.values());
        localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(athleteOnly));
        this.writeTemplatesCacheMeta(scopeKey);
        return athleteOnly;
      }

      const deletedIds = new Set(this.getDeletedTemplateIds());
      const mergedMap = new Map<string, Workout>();
      PRESET_WORKOUT_TEMPLATES.forEach(p => {
        if (!deletedIds.has(p.id)) mergedMap.set(p.id, p);
      });
      localScoped.forEach(t => {
        if (t.id !== '__kinetix_sys_branding__' && !deletedIds.has(t.id)) mergedMap.set(t.id, t);
      });
      cloudTemplates.forEach(t => {
        if (t.id === '__kinetix_sys_branding__' || deletedIds.has(t.id)) return;
        const keepInstance = t.isTemplate !== false || !t.scheduledDate || t.scheduledDate >= cutoff30d;
        if (keepInstance) mergedMap.set(t.id, t);
      });

      const merged = Array.from(mergedMap.values());
      localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(merged));
      this.writeTemplatesCacheMeta(scopeKey);
      return merged;
    })().finally(() => {
      this.templatesInflight.delete(scopeKey);
    });

    this.templatesInflight.set(scopeKey, promise);
    return promise;
  }

  // Estrategia Stale-While-Revalidate (expiración 24h):
  // 1) Si hay caché vigente (<24h), responde al instante desde localStorage y revalida Supabase en segundo plano.
  // 2) Si expiró (>24h) o no existe caché para ese usuario, sincroniza directo desde Supabase.
  async getTemplates(
    athleteId?: string,
    options?: { forceCloud?: boolean; onRevalidate?: (fresh: Workout[]) => void }
  ): Promise<Workout[]> {
    const scopeKey = athleteId || 'staff';
    const meta = this.readTemplatesCacheMeta();
    const hasRawCache = !!localStorage.getItem(KEYS.WORKOUT_TEMPLATES);
    const isCacheFresh =
      !options?.forceCloud &&
      hasRawCache &&
      !!meta &&
      meta.scope === scopeKey &&
      Date.now() - meta.syncedAt < this.TEMPLATES_TTL_MS;

    if (isCacheFresh) {
      const cachedList = this.getLocalTemplatesScoped(athleteId);
      const lastBg = this.lastBgRevalidateAt.get(scopeKey) || 0;
      if (isSupabaseConfigured && Date.now() - lastBg > this.BACKGROUND_REVALIDATE_COOLDOWN_MS) {
        this.lastBgRevalidateAt.set(scopeKey, Date.now());
        void this.syncTemplatesFromCloud(athleteId).then(fresh => {
          if (options?.onRevalidate) options.onRevalidate(fresh);
        });
      }
      return cachedList;
    }

    return this.syncTemplatesFromCloud(athleteId);
  }

  async fetchArchivableRoutines(daysOlderThan = 60): Promise<{
    workouts: Workout[];
    oldEventsCount: number;
    cutoffIso: string;
  }> {
    const cutoffIso = this.getLocalTodayIso(new Date(Date.now() - daysOlderThan * 86400000));
    let oldWorkouts: Workout[] = [];
    let oldEventsCount = 0;

    if (isSupabaseConfigured) {
      try {
        const [{ data: tplData }, { data: calData }] = await Promise.all([
          supabase
            .from('kinetix_templates')
            .select('*')
            .eq('isTemplate', false)
            .lt('scheduledDate', cutoffIso),
          supabase
            .from('kinetix_calendar')
            .select('id')
            .lt('start_at', cutoffIso)
        ]);
        if (Array.isArray(tplData)) oldWorkouts = tplData as Workout[];
        if (Array.isArray(calData)) oldEventsCount = calData.length;
      } catch (e) {
        console.warn('Error consultando archivo en nube:', e);
      }
    } else {
      try {
        const rawTpls: Workout[] = JSON.parse(localStorage.getItem(KEYS.WORKOUT_TEMPLATES) || '[]');
        oldWorkouts = rawTpls.filter(t => t.isTemplate === false && !!t.scheduledDate && t.scheduledDate < cutoffIso);
        const rawCal = JSON.parse(localStorage.getItem(KEYS.CALENDAR) || '[]');
        oldEventsCount = Array.isArray(rawCal)
          ? rawCal.filter((e: any) => String(e?.start || '').slice(0, 10) < cutoffIso).length
          : 0;
      } catch {}
    }

    return { workouts: oldWorkouts, oldEventsCount, cutoffIso };
  }

  async purgeArchivedRoutines(workoutIds: string[], cutoffIso: string): Promise<{ deletedWorkouts: number }> {
    let deletedWorkouts = 0;

    if (isSupabaseConfigured) {
      if (workoutIds.length > 0) {
        const { error } = await supabase.from('kinetix_templates').delete().in('id', workoutIds);
        if (!error) deletedWorkouts = workoutIds.length;
      }
      await supabase.from('kinetix_calendar').delete().lt('start_at', cutoffIso);
    } else {
      deletedWorkouts = workoutIds.length;
    }

    try {
      const idSet = new Set(workoutIds);
      const localTpls: Workout[] = JSON.parse(localStorage.getItem(KEYS.WORKOUT_TEMPLATES) || '[]');
      localStorage.setItem(
        KEYS.WORKOUT_TEMPLATES,
        JSON.stringify(localTpls.filter(t => !idSet.has(t.id)))
      );
      const localCal = JSON.parse(localStorage.getItem(KEYS.CALENDAR) || '[]');
      if (Array.isArray(localCal)) {
        localStorage.setItem(
          KEYS.CALENDAR,
          JSON.stringify(localCal.filter((e: any) => String(e?.start || '').slice(0, 10) >= cutoffIso))
        );
      }
      this.writeTemplatesCacheMeta('staff');
    } catch {}

    return { deletedWorkouts };
  }

  private toCloudTemplatePayload(tpl: Workout) {
    return {
      id: tpl.id,
      name: tpl.name,
      publicTitle: tpl.publicTitle || tpl.name,
      category: tpl.category || 'general',
      day: tpl.day || 1,
      exercises: Array.isArray(tpl.exercises) ? tpl.exercises : [],
      isCompleted: !!tpl.isCompleted,
      scheduledDate: tpl.scheduledDate || null,
      isTemplate: tpl.isTemplate !== false,
      assignedTo: tpl.assignedTo || null,
      location: tpl.location || 'Kinetix Functional Zone'
    };
  }

  // NUEVO: saveTemplate limpia campos extra antes de subir a Supabase para evitar rechazos o basura
  async saveTemplate(template: Workout) {
    const deletedIds = this.getDeletedTemplateIds().filter(id => id !== template.id);
    localStorage.setItem('kinetix_deleted_templates', JSON.stringify(deletedIds));

    const localTemplates = JSON.parse(localStorage.getItem(KEYS.WORKOUT_TEMPLATES) || '[]');
    const idx = localTemplates.findIndex((t: any) => t.id === template.id);
    if (idx >= 0) localTemplates[idx] = template; else localTemplates.push(template);
    localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(localTemplates));
    const currentUser = this.getUser();
    this.writeTemplatesCacheMeta(currentUser?.role === 'client' ? currentUser.id : 'staff');

    if (isSupabaseConfigured) {
        try {
            await supabase.from('kinetix_templates').upsert(this.toCloudTemplatePayload(template));
        } catch (e) { console.error("Error al sincronizar con Nube", e); }
    }
  }

  async deleteTemplate(templateId: string) {
    const deletedIds = Array.from(new Set([...this.getDeletedTemplateIds(), templateId]));
    localStorage.setItem('kinetix_deleted_templates', JSON.stringify(deletedIds));

    const localTemplates: Workout[] = JSON.parse(localStorage.getItem(KEYS.WORKOUT_TEMPLATES) || '[]');
    const filtered = localTemplates.filter(t => t.id !== templateId);
    localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(filtered));
    this.writeTemplatesCacheMeta('staff');

    if (isSupabaseConfigured) {
      try {
        await supabase.from('kinetix_templates').delete().eq('id', templateId);
      } catch (e) { console.error("Error al eliminar en Nube", e); }
    }
  }

  async replaceAllTemplates(templates: Workout[]) {
    localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(templates));
    this.writeTemplatesCacheMeta('staff');
    if (isSupabaseConfigured) {
      try {
        for (const tpl of templates) {
          await supabase.from('kinetix_templates').upsert(this.toCloudTemplatePayload(tpl));
        }
      } catch (e) { console.error("Error al sincronizar restauración", e); }
    }
  }

  getWorkoutById(id: string): Workout | undefined {
    try {
      const data = localStorage.getItem(KEYS.WORKOUT_TEMPLATES);
      const all: Workout[] = data ? JSON.parse(data) : [];
      const found = all.find(w => w.id === id) || PRESET_WORKOUT_TEMPLATES.find(p => p.id === id);
      if (
        found &&
        this.getUser()?.role === 'client' &&
        found.scheduledDate &&
        String(found.scheduledDate).slice(0, 10) > this.getServerTodayIsoSync()
      ) {
        return undefined;
      }
      return found;
    } catch {
      return PRESET_WORKOUT_TEMPLATES.find(p => p.id === id);
    }
  }

  async seedSupabaseDatabase(): Promise<{ success: boolean; message: string; templatesCount: number; athletesCount: number }> {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: 'Supabase no está configurado aún. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY o ingrésalos en la consola.',
        templatesCount: 0,
        athletesCount: 0
      };
    }

    try {
      const templates = PRESET_WORKOUT_TEMPLATES;
      const athletes = this.getAthletes();

      let templatesInserted = 0;
      let athletesInserted = 0;

      // 1. Insertar plantillas en public.kinetix_templates
      for (const tpl of templates) {
        const { error } = await supabase.from('kinetix_templates').upsert({
          id: tpl.id,
          name: tpl.name,
          publicTitle: tpl.publicTitle || tpl.name,
          category: tpl.category || 'general',
          day: tpl.day || 1,
          exercises: tpl.exercises || [],
          isCompleted: false,
          isTemplate: true,
          scheduledDate: tpl.scheduledDate || null,
          assignedTo: tpl.assignedTo || null,
          location: tpl.location || 'Kinetix Functional Zone'
        });
        if (!error) templatesInserted++;
      }

      // 2. Insertar atletas en public.athletes
      for (const ath of athletes) {
        const res = await this.upsertAthleteCloud(ath);
        if (res.ok) athletesInserted++;
      }

      return {
        success: true,
        message: `¡Sincronización exitosa! Se sembraron ${templatesInserted} rutinas maestras y ${athletesInserted} atletas en Supabase.`,
        templatesCount: templatesInserted,
        athletesCount: athletesInserted
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error al sembrar en Supabase: ${err?.message || 'Verifica haber corrido el script SQL en Supabase primero.'}`,
        templatesCount: 0,
        athletesCount: 0
      };
    }
  }

  cloneWithProgression(workout: Workout, athleteId: string, weeks: number, incrementWeight: number, incrementReps: number): Workout[] {
      const results: Workout[] = [];
      const timestamp = Date.now();
      for (let w = 1; w <= weeks; w++) {
          const cloned: Workout = JSON.parse(JSON.stringify(workout));
          cloned.id = `meso-${athleteId}-w${w}-${timestamp}`;
          cloned.name = `${workout.name} - Sem ${w}`;
          cloned.assignedTo = athleteId;
          cloned.isTemplate = false;
          
          cloned.exercises = cloned.exercises.map(ex => {
              if (incrementWeight > 0 && ex.targetLoad) {
                  ex.targetLoad = ex.targetLoad.split(',').map(v => {
                      const num = parseFloat(v.trim());
                      return isNaN(num) ? v : (num + (incrementWeight * (w - 1))).toString();
                  }).join(', ');
              }
              return ex;
          });
          results.push(cloned);
      }
      return results;
  }

  getPRs(athleteId?: string): PRRecord[] {
    try {
      const data = localStorage.getItem(KEYS.PRS);
      const prs: PRRecord[] = data ? JSON.parse(data) : [];
      return prs;
    } catch (e) {
      return [];
    }
  }

  savePR(pr: PRRecord) {
    const prs = this.getPRs().filter(p => p.exerciseId !== pr.exerciseId);
    prs.push(pr);
    localStorage.setItem(KEYS.PRS, JSON.stringify(prs));
  }

  getLastExerciseNote(exerciseId: string, athleteId?: string): string {
    try {
      const cacheKey = `kinetix_ex_notes_${athleteId || 'default'}`;
      const rawMap = localStorage.getItem(cacheKey);
      if (rawMap) {
        const parsed = JSON.parse(rawMap) as Record<string, string>;
        if (parsed[exerciseId]) return parsed[exerciseId];
      }
    } catch {}
    const logs = this.getAllLogs()
      .filter(
        l =>
          l.exerciseId === exerciseId &&
          l.exerciseId !== 'kinetix-session-done' &&
          l.exerciseId !== 'kinetix-session-reopen' &&
          (!athleteId || !l.athleteId || l.athleteId === athleteId) &&
          l.notes &&
          l.notes.trim()
      )
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return logs[0]?.notes?.trim() || '';
  }

  private cacheExerciseNoteLocal(exerciseId: string, note: string, athleteId?: string) {
    if (exerciseId === 'kinetix-session-done' || exerciseId === 'kinetix-session-reopen') return;
    try {
      const cacheKey = `kinetix_ex_notes_${athleteId || 'default'}`;
      const current = JSON.parse(localStorage.getItem(cacheKey) || '{}') as Record<string, string>;
      if (note.trim()) {
        current[exerciseId] = note.trim();
      } else {
        delete current[exerciseId];
      }
      const entries = Object.entries(current).slice(-100);
      localStorage.setItem(cacheKey, JSON.stringify(Object.fromEntries(entries)));
    } catch {}
  }

  async saveExerciseQuickNote(
    exerciseId: string,
    note: string,
    athleteId?: string,
    workoutId?: string,
    workoutName?: string
  ): Promise<{ ok: boolean; error?: string }> {
    const cleanNote = note.trim().slice(0, 160);
    if (!cleanNote) return { ok: false, error: 'Nota vacía' };

    this.cacheExerciseNoteLocal(exerciseId, cleanNote, athleteId);

    const todayIso = this.getServerTodayIsoSync();
    const currentLogs = this.getAllLogs();
    const existingIdx = currentLogs.findIndex(
      l =>
        l.exerciseId === exerciseId &&
        (!athleteId || !l.athleteId || l.athleteId === athleteId) &&
        this.getLogServerDateIso(l.timestamp) === todayIso
    );

    if (existingIdx >= 0) {
      currentLogs[existingIdx] = { ...currentLogs[existingIdx], notes: cleanNote };
    } else {
      currentLogs.unshift({
        exerciseId,
        setIndex: 0,
        weight: 0,
        reps: 0,
        timestamp: new Date().toISOString(),
        isPR: false,
        athleteId,
        workoutId,
        workoutName,
        notes: cleanNote
      });
    }
    localStorage.setItem(KEYS.LOG_HISTORY, JSON.stringify(currentLogs.slice(0, 250)));

    if (!isSupabaseConfigured) return { ok: true };

    try {
      const dayStart = `${todayIso}T00:00:00.000Z`;
      let findQuery = supabase
        .from('workout_logs')
        .select('id')
        .eq('exercise_id', exerciseId)
        .gte('timestamp', dayStart)
        .order('timestamp', { ascending: false })
        .limit(1);
      if (athleteId) findQuery = findQuery.eq('athlete_id', athleteId);

      const { data: existingRows } = await findQuery;
      if (existingRows && existingRows.length > 0 && existingRows[0]?.id) {
        const { error: updErr } = await supabase
          .from('workout_logs')
          .update({ notes: cleanNote })
          .eq('id', existingRows[0].id);
        if (!updErr) return { ok: true };
        return { ok: false, error: 'Ejecuta el SQL actualizado para guardar notas en workout_logs.' };
      }

      const { error: insErr } = await supabase.from('workout_logs').insert({
        athlete_id: athleteId || null,
        exercise_id: exerciseId,
        weight: 0,
        reps: 0,
        is_pr: false,
        notes: cleanNote,
        timestamp: new Date().toISOString()
      });
      if (!insErr) return { ok: true };
      return { ok: false, error: 'Ejecuta el SQL actualizado en Sistema para sincronizar notas en nube.' };
    } catch (e: any) {
      return { ok: false, error: e?.message || 'Error al guardar nota en nube' };
    }
  }

  async saveSessionLogs(logs: WorkoutLog[]): Promise<void> {
    const currentLogs = this.getAllLogs();
    const currentPRs = this.getPRs();
    const exercises = this.getExercises();
    const fallbackAthleteId = this.getUser()?.id;

    const processedLogs = logs.map(rawLog => {
      const log: WorkoutLog = {
        ...rawLog,
        athleteId: rawLog.athleteId || fallbackAthleteId,
        timestamp: rawLog.timestamp || new Date().toISOString()
      };
      const isSystemMarker = log.exerciseId === 'kinetix-session-done' || log.exerciseId === 'kinetix-session-reopen';
      if (log.notes && log.notes.trim() && !isSystemMarker) {
        this.cacheExerciseNoteLocal(log.exerciseId, log.notes.trim(), log.athleteId);
      }
      const w = Number(log.weight) || 0;
      const r = Number(log.reps) || 0;
      if (w > 0 && r > 0 && log.exerciseId !== 'kinetix-class-log' && !isSystemMarker) {
        const est1RM = Math.round(w * (1 + r / 30) * 10) / 10;
        const existingPR = currentPRs.find(p => p.exerciseId === log.exerciseId);
        
        if (!existingPR || est1RM > existingPR.estimated1RM) {
          const exName = exercises.find(e => e.id === log.exerciseId)?.name || log.exerciseId;
          const newPR: PRRecord = {
            id: `pr-${log.exerciseId}-${Date.now()}`,
            exerciseId: log.exerciseId,
            exerciseName: exName,
            weight: w,
            reps: r,
            estimated1RM: est1RM,
            date: this.getServerTodayIsoSync()
          };
          this.savePR(newPR);
          return { ...log, isPR: true };
        }
      }
      return log;
    });

    // Si hay series reales para un ejercicio hoy, elimina el marcador 0x0 previo para no acumular basura
    const realExerciseKeysToday = new Set(
      processedLogs
        .filter(l => (Number(l.weight) > 0 || Number(l.reps) > 0))
        .map(l => `${l.athleteId || ''}|${l.exerciseId}|${this.getLogServerDateIso(l.timestamp)}`)
    );
    const cleanedPrevLogs = currentLogs.filter(l => {
      if (l.exerciseId === 'kinetix-session-done' || l.exerciseId === 'kinetix-session-reopen') return true;
      const isPlaceholder = Number(l.weight) === 0 && Number(l.reps) === 0;
      if (!isPlaceholder) return true;
      const key = `${l.athleteId || ''}|${l.exerciseId}|${this.getLogServerDateIso(l.timestamp)}`;
      return !realExerciseKeysToday.has(key);
    });

    // Evita acumulación de basura en localStorage manteniendo máximo 250 logs recientes
    const trimmedLogs = [...cleanedPrevLogs, ...processedLogs]
      .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
      .slice(0, 250);
    localStorage.setItem(KEYS.LOG_HISTORY, JSON.stringify(trimmedLogs));

    if (isSupabaseConfigured && processedLogs.length > 0) {
      const fullRows = processedLogs.map(l => ({
        athlete_id: l.athleteId || null,
        exercise_id: l.exerciseId,
        weight: Number(l.weight) || 0,
        reps: Number(l.reps) || 0,
        is_pr: !!l.isPR,
        notes: l.notes?.trim() || null,
        timestamp: l.timestamp || new Date().toISOString()
      }));
      try {
        const { error } = await supabase.from('workout_logs').insert(fullRows);
        if (error) {
          // Fallback seguro si la columna notes aún no existe en Supabase
          const basicRows = fullRows.map(({ notes: _n, ...rest }) => rest);
          const { error: err2 } = await supabase.from('workout_logs').insert(basicRows);
          if (err2) console.warn('Cloud log insert skipped:', err2.message);
        }
      } catch (e: any) {
        console.warn('Cloud log insert error:', e?.message);
      }
    }
  }

  async syncLogsFromCloud(athleteId?: string): Promise<WorkoutLog[]> {
    const local = this.getAllLogs();
    if (!isSupabaseConfigured) return local;
    try {
      let query = supabase.from('workout_logs').select('*').order('timestamp', { ascending: false }).limit(250);
      if (athleteId) query = query.eq('athlete_id', athleteId);
      const { data, error } = await query;
      if (error || !data) return local;

      const cloudLogs: WorkoutLog[] = data.map((row: any, idx: number) => ({
        athleteId: row.athlete_id || undefined,
        exerciseId: row.exercise_id,
        setIndex: idx,
        weight: Number(row.weight) || 0,
        reps: Number(row.reps) || 0,
        isPR: !!row.is_pr,
        notes: row.notes || undefined,
        timestamp: row.timestamp
      }));

      const seen = new Set(local.map(l => `${l.athleteId || ''}_${l.exerciseId}_${l.timestamp}_${l.weight}_${l.reps}`));
      const merged = [...local];
      cloudLogs.forEach(cl => {
        const sig = `${cl.athleteId || ''}_${cl.exerciseId}_${cl.timestamp}_${cl.weight}_${cl.reps}`;
        if (!seen.has(sig)) {
          seen.add(sig);
          merged.push(cl);
        }
      });
      const capped = merged
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
        .slice(0, 250);
      localStorage.setItem(KEYS.LOG_HISTORY, JSON.stringify(capped));
      return capped;
    } catch (e) {
      return local;
    }
  }

  getAllLogs(): WorkoutLog[] {
    try {
      const data = localStorage.getItem(KEYS.LOG_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  getMuscleStatus(): MuscleStatus[] { 
    const logs = this.getAllLogs();
    const now = Date.now();
    const hours72 = 72 * 3600 * 1000;

    const recentLogs = logs.filter(l => {
      if (l.exerciseId === 'kinetix-session-done' || l.exerciseId === 'kinetix-session-reopen') return false;
      const logTime = new Date(l.timestamp).getTime();
      return !isNaN(logTime) && (now - logTime) <= hours72;
    });

    const exercises = this.getExercises();
    const zoneSets: Record<string, number> = { Push: 0, Pull: 0, Legs: 0, Core: 0 };

    recentLogs.forEach(l => {
      const ex = exercises.find(e => e.id === l.exerciseId) || EXERCISES_DB.find(e => e.id === l.exerciseId);
      const name = (ex?.name || '').toLowerCase();
      const muscle = (ex?.muscleGroup || '').toLowerCase();

      if (muscle.includes('pecho') || muscle.includes('tríceps') || muscle.includes('hombro') || name.includes('press') || name.includes('push')) {
        zoneSets.Push += 1;
      } else if (muscle.includes('espalda') || muscle.includes('bíceps') || name.includes('pull') || name.includes('remo') || name.includes('dominada')) {
        zoneSets.Pull += 1;
      } else if (muscle.includes('pierna') || muscle.includes('glúteo') || name.includes('sentadilla') || name.includes('squat') || name.includes('prensa')) {
        zoneSets.Legs += 1;
      } else {
        zoneSets.Core += 1;
      }
    });

    const calculateStatus = (sets: number): { status: 'fatigued' | 'recovering' | 'optimal'; level: number } => {
      if (sets >= 8) return { status: 'fatigued', level: Math.max(15, 100 - sets * 7) };
      if (sets >= 3) return { status: 'recovering', level: Math.max(45, 90 - sets * 8) };
      return { status: 'optimal', level: 95 };
    };

    return [
      { zone: 'Push', ...calculateStatus(zoneSets.Push) },
      { zone: 'Pull', ...calculateStatus(zoneSets.Pull) },
      { zone: 'Legs', ...calculateStatus(zoneSets.Legs) },
      { zone: 'Core', ...calculateStatus(zoneSets.Core) }
    ];
  }

  getLocalTodayIso(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatDateInServerTz(date: Date = new Date(), timeZone = 'America/Mexico_City'): string {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date);
    } catch {
      return this.getLocalTodayIso(date);
    }
  }

  getServerTodayIsoSync(): string {
    return this.cachedServerDate?.date || this.formatDateInServerTz(new Date());
  }

  getLogServerDateIso(timestamp?: string): string {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return String(timestamp).slice(0, 10);
    return this.formatDateInServerTz(d);
  }

  async fetchServerTodayIso(force = false): Promise<string> {
    if (!force && this.cachedServerDate && Date.now() - this.cachedServerDate.fetchedAt < 60_000) {
      return this.cachedServerDate.date;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch('/api/health', { signal: controller.signal, cache: 'no-store' });
      const headerDate = res.headers.get('date');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (typeof data?.serverDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.serverDate)) {
          this.cachedServerDate = { date: data.serverDate, fetchedAt: Date.now() };
          return data.serverDate;
        }
        if (typeof data?.serverIso === 'string') {
          const parsed = new Date(data.serverIso);
          if (!isNaN(parsed.getTime())) {
            const tzDate = this.formatDateInServerTz(parsed, data.timeZone || 'America/Mexico_City');
            this.cachedServerDate = { date: tzDate, fetchedAt: Date.now() };
            return tzDate;
          }
        }
      }
      if (headerDate) {
        const parsedHeader = new Date(headerDate);
        if (!isNaN(parsedHeader.getTime())) {
          const tzDate = this.formatDateInServerTz(parsedHeader);
          this.cachedServerDate = { date: tzDate, fetchedAt: Date.now() };
          return tzDate;
        }
      }
    } catch {
      // Fallback silencioso a conversión segura en TZ del servidor
    } finally {
      clearTimeout(timer);
    }
    const fallback = this.formatDateInServerTz(new Date());
    this.cachedServerDate = { date: fallback, fetchedAt: Date.now() };
    return fallback;
  }

  isMembershipExpired(user: User, referenceDateIso?: string): boolean {
    if (!user || user.role !== 'client' || user.isUnlimited) return false;
    const isDemo = user.email?.toLowerCase().endsWith('@demo.com') || user.name?.toLowerCase().includes('(demo)');
    if (isDemo || !user.cycleEndDate) return false;
    const normalizedEnd = String(user.cycleEndDate).trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedEnd)) return false;
    const todayIso = referenceDateIso || this.getServerTodayIsoSync();
    return normalizedEnd < todayIso;
  }

  private getTodayLockTimeline(athleteId: string, workoutId?: string) {
    const todayStr = this.getServerTodayIsoSync();
    const allLogs = this.getAllLogs();
    let latestDoneTs = 0;
    let latestReopenTs = 0;

    allLogs.forEach(l => {
      if (l.athleteId !== athleteId) return;
      if (this.getLogServerDateIso(l.timestamp) !== todayStr) return;
      const ms = new Date(l.timestamp).getTime() || 0;
      if (l.exerciseId === 'kinetix-session-reopen') {
        if (ms > latestReopenTs) latestReopenTs = ms;
        return;
      }
      if (l.exerciseId === 'kinetix-session-done') {
        const matchesWorkout =
          !workoutId ||
          !l.notes ||
          !l.notes.includes('[SESSION_DONE:') ||
          l.notes.includes(`[SESSION_DONE:${workoutId}:`);
        if (matchesWorkout && ms > latestDoneTs) latestDoneTs = ms;
        return;
      }
      const isRealSet = Number(l.weight) > 0 || Number(l.reps) > 0 || l.exerciseId === 'kinetix-class-log';
      if (isRealSet && ms > latestDoneTs) {
        latestDoneTs = ms;
      }
    });

    if (localStorage.getItem(`kinetix_reopened_${athleteId}`) === todayStr) {
      const localReopenMs = Number(localStorage.getItem(`kinetix_reopened_ts_${athleteId}`) || 0);
      if (localReopenMs > latestReopenTs) latestReopenTs = localReopenMs;
    }

    const lockedId = localStorage.getItem(`kinetix_locked_${athleteId}_${todayStr}`);
    if (lockedId && (!workoutId || lockedId === workoutId)) {
      const localLockMs = Number(localStorage.getItem(`kinetix_locked_ts_${athleteId}_${todayStr}`) || Date.now());
      if (localLockMs > latestDoneTs) latestDoneTs = localLockMs;
    }

    return { todayStr, latestDoneTs, latestReopenTs };
  }

  isSessionComplete(workoutId: string, athleteId?: string): boolean {
    if (athleteId) {
      const { latestDoneTs, latestReopenTs } = this.getTodayLockTimeline(athleteId, workoutId);
      if (latestDoneTs > 0 && latestDoneTs >= latestReopenTs) return true;
      if (latestReopenTs > latestDoneTs) return false;
      return false;
    }
    try {
      const data = localStorage.getItem(KEYS.COMPLETED_SESSIONS);
      const list = data ? JSON.parse(data) : [];
      return Array.isArray(list) && list.includes(workoutId);
    } catch {
      return false;
    }
  }

  isSessionReopenedByCoach(athleteId: string): boolean {
    const { latestDoneTs, latestReopenTs } = this.getTodayLockTimeline(athleteId);
    if (latestReopenTs > 0 && latestReopenTs > latestDoneTs) return true;
    const todayStr = this.getServerTodayIsoSync();
    return localStorage.getItem(`kinetix_reopened_${athleteId}`) === todayStr && latestDoneTs === 0;
  }

  async markSessionComplete(workoutId: string, athleteId?: string): Promise<void> {
    const todayStr = this.getServerTodayIsoSync();
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    if (athleteId) {
      localStorage.removeItem(`kinetix_reopened_${athleteId}`);
      localStorage.removeItem(`kinetix_reopened_ts_${athleteId}`);
      localStorage.setItem(`kinetix_locked_${athleteId}_${todayStr}`, workoutId);
      localStorage.setItem(`kinetix_locked_ts_${athleteId}_${todayStr}`, String(nowMs));
    }
    try {
      const data = localStorage.getItem(KEYS.COMPLETED_SESSIONS);
      const list = data ? JSON.parse(data) : [];
      if (!list.includes(workoutId)) {
        list.push(workoutId);
        localStorage.setItem(KEYS.COMPLETED_SESSIONS, JSON.stringify(list));
      }
    } catch {}

    if (athleteId) {
      const doneMarker: WorkoutLog = {
        athleteId,
        exerciseId: 'kinetix-session-done',
        setIndex: 0,
        weight: 0,
        reps: 0,
        timestamp: nowIso,
        isPR: false,
        workoutId,
        notes: `[SESSION_DONE:${workoutId}:${todayStr}]`
      };
      const prevLogs = this.getAllLogs().filter(
        l =>
          !(
            l.athleteId === athleteId &&
            this.getLogServerDateIso(l.timestamp) === todayStr &&
            (l.exerciseId === 'kinetix-session-done' || l.exerciseId === 'kinetix-session-reopen')
          )
      );
      localStorage.setItem(KEYS.LOG_HISTORY, JSON.stringify([doneMarker, ...prevLogs].slice(0, 250)));

      if (isSupabaseConfigured) {
        try {
          const fullRow = {
            athlete_id: athleteId,
            exercise_id: 'kinetix-session-done',
            weight: 0,
            reps: 0,
            is_pr: false,
            notes: doneMarker.notes,
            timestamp: nowIso
          };
          const { error } = await supabase.from('workout_logs').insert(fullRow);
          if (error) {
            const { notes: _n, ...basicRow } = fullRow;
            await supabase.from('workout_logs').insert(basicRow);
          }
        } catch (e) {
          console.warn('Error sincronizando bloqueo de sesión:', e);
        }
      }
    }
  }

  async reopenSessionForAthlete(athleteId: string, workoutId?: string): Promise<void> {
    const todayStr = this.getServerTodayIsoSync();
    const nowIso = new Date().toISOString();
    const nowMs = Date.now();
    localStorage.setItem(`kinetix_reopened_${athleteId}`, todayStr);
    localStorage.setItem(`kinetix_reopened_ts_${athleteId}`, String(nowMs));
    localStorage.removeItem(`kinetix_locked_${athleteId}_${todayStr}`);
    localStorage.removeItem(`kinetix_locked_ts_${athleteId}_${todayStr}`);
    if (workoutId) {
      try {
        const data = localStorage.getItem(KEYS.COMPLETED_SESSIONS);
        const list: string[] = data ? JSON.parse(data) : [];
        localStorage.setItem(KEYS.COMPLETED_SESSIONS, JSON.stringify(list.filter(id => id !== workoutId)));
      } catch {}
    }

    const reopenMarker: WorkoutLog = {
      athleteId,
      exerciseId: 'kinetix-session-reopen',
      setIndex: 0,
      weight: 0,
      reps: 0,
      timestamp: nowIso,
      isPR: false,
      workoutId,
      notes: `[SESSION_REOPEN:${todayStr}]`
    };
    const filteredLocal = this.getAllLogs().filter(
      l =>
        !(
          l.athleteId === athleteId &&
          this.getLogServerDateIso(l.timestamp) === todayStr &&
          l.exerciseId === 'kinetix-session-done'
        )
    );
    localStorage.setItem(KEYS.LOG_HISTORY, JSON.stringify([reopenMarker, ...filteredLocal].slice(0, 250)));

    if (isSupabaseConfigured) {
      try {
        const windowStart = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
        await supabase
          .from('workout_logs')
          .delete()
          .eq('athlete_id', athleteId)
          .eq('exercise_id', 'kinetix-session-done')
          .gte('timestamp', windowStart);

        const fullRow = {
          athlete_id: athleteId,
          exercise_id: 'kinetix-session-reopen',
          weight: 0,
          reps: 0,
          is_pr: false,
          notes: reopenMarker.notes,
          timestamp: nowIso
        };
        const { error } = await supabase.from('workout_logs').insert(fullRow);
        if (error) {
          const { notes: _n, ...basicRow } = fullRow;
          await supabase.from('workout_logs').insert(basicRow);
        }
      } catch (e) {
        console.warn('Error sincronizando desbloqueo en Supabase:', e);
      }
    }
  }

  getLastPerformance(exId: string, athleteId?: string) {
      const logs = this.getAllLogs()
        .filter(
          l =>
            l.exerciseId === exId &&
            l.exerciseId !== 'kinetix-session-done' &&
            l.exerciseId !== 'kinetix-session-reopen' &&
            (!athleteId || !l.athleteId || l.athleteId === athleteId) &&
            (Number(l.weight) > 0 || Number(l.reps) > 0)
        )
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      return logs.length > 0 ? { weight: Number(logs[0].weight) || 0, reps: Number(logs[0].reps) || 0 } : null;
  }

  getAiBlueprints(): AiBlueprint[] { 
    return JSON.parse(localStorage.getItem(KEYS.AI_BLUEPRINTS) || '[]'); 
  }
  saveAiBlueprint(b: AiBlueprint) { 
    const old = this.getAiBlueprints(); 
    localStorage.setItem(KEYS.AI_BLUEPRINTS, JSON.stringify([b, ...old])); 
  }
  deleteAiBlueprint(id: string) {
    const old = this.getAiBlueprints();
    localStorage.setItem(KEYS.AI_BLUEPRINTS, JSON.stringify(old.filter(x => x.id !== id)));
  }
  getAiPrompts(): string[] { 
    return JSON.parse(localStorage.getItem(KEYS.AI_PROMPT_HISTORY) || '[]'); 
  }
  saveAiPrompt(p: string) { 
    const old = this.getAiPrompts(); 
    localStorage.setItem(KEYS.AI_PROMPT_HISTORY, JSON.stringify([p, ...old].slice(0,15))); 
  }

  saveSystemConfig(config: any) {
      localStorage.setItem(KEYS.SYSTEM_CONFIG, JSON.stringify(config));
  }

  getStorageUsage() {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) total += (localStorage.getItem(key)?.length || 0);
      }
      const usedKB = Math.round(total / 1024);
      const percentage = Math.min(Math.round((total / (5 * 1024 * 1024)) * 100), 100);
      return { usedKB, percentage };
  }

  createBackup(): string {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('kinetix_')) {
              data[key] = localStorage.getItem(key) || '';
          }
      }
      return JSON.stringify(data);
  }

  restoreBackup(json: string): boolean {
      try {
          const data = JSON.parse(json);
          Object.entries(data).forEach(([key, val]) => {
              if (key.startsWith('kinetix_')) {
                  localStorage.setItem(key, val as string);
              }
          });
          return true;
      } catch (e) {
          return false;
      }
  }

  cleanupStaleData(): { removedKeys: number; removedTemplates: number } {
    const todayStr = this.getLocalTodayIso();
    let removedKeys = 0;
    let removedTemplates = 0;

    try {
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('kinetix_locked_') && !key.endsWith(`_${todayStr}`)) {
          keysToDelete.push(key);
        } else if (key === KEYS.AI_PROMPT_HISTORY || key === KEYS.AI_BLUEPRINTS || key.startsWith('kinetix_coach_directive_v2_')) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(k => localStorage.removeItem(k));
      removedKeys = keysToDelete.length;

      // Limpiar instancias temporales vacías antiguas (class-*) o duplicadas > 14 días atrás
      const cutoffDate = new Date(Date.now() - 14 * 86400000);
      const cutoffIso = this.getLocalTodayIso(cutoffDate);
      const rawTpls = localStorage.getItem(KEYS.WORKOUT_TEMPLATES);
      if (rawTpls) {
        const parsed: Workout[] = JSON.parse(rawTpls);
        const cleaned = parsed.filter(t => {
          const isOldInstance = t.isTemplate === false && t.scheduledDate && t.scheduledDate < cutoffIso && (!t.exercises || t.exercises.length === 0);
          if (isOldInstance) removedTemplates++;
          return !isOldInstance;
        });
        if (removedTemplates > 0) {
          localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(cleaned));
        }
      }

      // Limpiar eventos de calendario de hace más de 60 días para no saturar navegador
      const calCutoff = this.getLocalTodayIso(new Date(Date.now() - 60 * 86400000));
      const rawCal = localStorage.getItem(KEYS.CALENDAR);
      if (rawCal) {
        const calEvents = JSON.parse(rawCal);
        if (Array.isArray(calEvents)) {
          const recentCal = calEvents.filter((e: any) => {
            const d = String(e?.start || '').slice(0, 10);
            return !d || d >= calCutoff;
          });
          if (recentCal.length < calEvents.length) {
            localStorage.setItem(KEYS.CALENDAR, JSON.stringify(recentCal));
          }
        }
      }

      // Mantener tope de 250 logs locales
      const rawLogs = localStorage.getItem(KEYS.LOG_HISTORY);
      if (rawLogs) {
        const parsedLogs = JSON.parse(rawLogs);
        if (Array.isArray(parsedLogs) && parsedLogs.length > 250) {
          localStorage.setItem(KEYS.LOG_HISTORY, JSON.stringify(parsedLogs.slice(0, 250)));
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    return { removedKeys, removedTemplates };
  }

  async runIntegrityScan(): Promise<IntegrityScanReport> {
    const todayStr = this.getServerTodayIsoSync();
    const cutoff30d = this.formatDateInServerTz(new Date(Date.now() - 30 * 86400000));
    const exercises = this.getExercises();
    const exerciseIdSet = new Set([
      ...exercises.map(e => e.id),
      ...EXERCISES_DB.map(e => e.id)
    ]);

    const localAthletes = this.getAthletes();
    const localTemplates: Workout[] = (() => {
      try {
        return JSON.parse(localStorage.getItem(KEYS.WORKOUT_TEMPLATES) || '[]');
      } catch {
        return [];
      }
    })();
    const localCalendar: any[] = (() => {
      try {
        const parsed = JSON.parse(localStorage.getItem(KEYS.CALENDAR) || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    })();
    const localLogs = this.getAllLogs();

    let cloudChecked = false;
    let cloudTemplates: Workout[] = [];
    let cloudCalendar: any[] = [];
    let cloudLogs: any[] = [];
    let cloudAthletes: any[] = [];

    if (isSupabaseConfigured) {
      try {
        const [tplRes, calRes, logRes, athRes] = await Promise.all([
          supabase.from('kinetix_templates').select('id, name, isTemplate, scheduledDate, assignedTo, exercises'),
          supabase.from('kinetix_calendar').select('id, title, start_at, athlete_ids, workout_template_id'),
          supabase.from('workout_logs').select('id, athlete_id, exercise_id, weight, reps, notes, timestamp').order('timestamp', { ascending: false }).limit(500),
          supabase.from('athletes').select('id, name')
        ]);
        if (!tplRes.error && !calRes.error) {
          cloudChecked = true;
          cloudTemplates = Array.isArray(tplRes.data) ? (tplRes.data as Workout[]) : [];
          cloudCalendar = Array.isArray(calRes.data) ? calRes.data : [];
          cloudLogs = Array.isArray(logRes.data) ? logRes.data : [];
          cloudAthletes = Array.isArray(athRes.data) ? athRes.data : [];
        }
      } catch (e) {
        console.warn('Integrity scan cloud fallback:', e);
      }
    }

    const findings: IntegrityFinding[] = [];
    const cleanableTemplateIds = new Set<string>();
    const cleanableCalendarIds = new Set<string>();
    const cleanableCloudLogIds = new Set<string>();
    const cleanableLocalKeys: string[] = [];

    let trashSessionsCount = 0;
    let orphanExercisesCount = 0;
    let orphanCalendarCount = 0;
    let stale30dCount = 0;

    // 1. Llaves locales obsoletas en localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('kinetix_locked_') && !key.endsWith(`_${todayStr}`)) {
        cleanableLocalKeys.push(key);
        trashSessionsCount++;
        findings.push({
          id: `ls-${key}`,
          source: 'localStorage',
          category: 'trash_session',
          label: 'Bloqueo de sesión expirado',
          detail: `Llave ${key} de un día anterior sin utilidad activa.`
        });
      } else if (key === KEYS.AI_PROMPT_HISTORY || key === KEYS.AI_BLUEPRINTS || key.startsWith('kinetix_coach_directive_v2_')) {
        cleanableLocalKeys.push(key);
        trashSessionsCount++;
        findings.push({
          id: `ls-${key}`,
          source: 'localStorage',
          category: 'trash_session',
          label: 'Caché residual de prompts IA',
          detail: `Llave ${key} innecesaria en modo 0-tokens.`
        });
      }
    }

    // Construir mapa de actividad real (logs con carga, reps, notas o check-in real)
    const activeLogDayKeys = new Set<string>();
    const activeAthleteIds = new Set<string>([
      ...localAthletes.map(a => a.id),
      ...cloudAthletes.map((a: any) => a.id)
    ]);

    const registerLogActivity = (athleteId: string | undefined, timestamp: string | undefined, weight: any, reps: any, notes: any, exId: string) => {
      const hasActivity = Number(weight) > 0 || Number(reps) > 0 || !!String(notes || '').trim() || exId === 'kinetix-class-log' || exId === 'kinetix-session-done';
      if (hasActivity && timestamp) {
        const day = this.getLogServerDateIso(timestamp);
        if (day) activeLogDayKeys.add(`${athleteId || ''}|${day}`);
      }
    };

    localLogs.forEach(l => registerLogActivity(l.athleteId, l.timestamp, l.weight, l.reps, l.notes, l.exerciseId));
    cloudLogs.forEach((l: any) => registerLogActivity(l.athlete_id, l.timestamp, l.weight, l.reps, l.notes, l.exercise_id));

    // 2. Auditar rutinas e instancias (localStorage + Supabase)
    const mergedTemplates = new Map<string, { tpl: Workout; source: 'localStorage' | 'Supabase' }>();
    localTemplates.forEach(t => mergedTemplates.set(t.id, { tpl: t, source: 'localStorage' }));
    cloudTemplates.forEach(t => mergedTemplates.set(t.id, { tpl: t, source: 'Supabase' }));

    const validTemplateIds = new Set<string>([
      ...PRESET_WORKOUT_TEMPLATES.map(p => p.id),
      ...Array.from(mergedTemplates.keys())
    ]);

    mergedTemplates.forEach(({ tpl, source }) => {
      if (tpl.id === '__kinetix_sys_branding__') return;
      const exList = Array.isArray(tpl.exercises) ? tpl.exercises : [];
      const schedDate = tpl.scheduledDate ? String(tpl.scheduledDate).slice(0, 10) : '';
      const hasActivityOnDate = !!schedDate && activeLogDayKeys.has(`${tpl.assignedTo || ''}|${schedDate}`);

      if (tpl.isTemplate === false) {
        if (exList.length === 0 && (!schedDate || (schedDate < todayStr && !hasActivityOnDate))) {
          trashSessionsCount++;
          cleanableTemplateIds.add(tpl.id);
          findings.push({
            id: `tpl-trash-${tpl.id}`,
            source,
            category: 'trash_session',
            label: tpl.name || 'Sesión vacía sin bloques',
            detail: `Instancia individual (${tpl.id}) sin ejercicios ni actividad asociada.`,
            date: schedDate || undefined
          });
        } else if (schedDate && schedDate < cutoff30d && !hasActivityOnDate) {
          stale30dCount++;
          cleanableTemplateIds.add(tpl.id);
          findings.push({
            id: `tpl-stale-${tpl.id}`,
            source,
            category: 'stale_30d',
            label: tpl.name || 'Instancia > 30 días sin actividad',
            detail: `Programada el ${schedDate} para atleta ${tpl.assignedTo || 'N/A'} sin logs asociados.`,
            date: schedDate
          });
        }
      }

      exList.forEach(block => {
        if (block?.exerciseId && !exerciseIdSet.has(block.exerciseId)) {
          orphanExercisesCount++;
          findings.push({
            id: `tpl-ex-${tpl.id}-${block.exerciseId}`,
            source,
            category: 'orphan_exercise',
            label: block.name || block.exerciseId,
            detail: `Ejercicio huérfano dentro de "${tpl.name}" (no existe en biblioteca actual).`
          });
        }
      });
    });

    // 3. Auditar eventos de calendario (localStorage + Supabase)
    const mergedEvents = new Map<string, { evt: any; source: 'localStorage' | 'Supabase' }>();
    localCalendar.forEach((e: any) => mergedEvents.set(e.id, {
      evt: {
        id: e.id,
        title: e.title,
        startDate: String(e.start || '').slice(0, 10),
        athleteIds: Array.isArray(e.athleteIds) ? e.athleteIds : [],
        workoutTemplateId: e.workoutTemplateId
      },
      source: 'localStorage'
    }));
    cloudCalendar.forEach((e: any) => mergedEvents.set(e.id, {
      evt: {
        id: e.id,
        title: e.title,
        startDate: String(e.start_at || '').slice(0, 10),
        athleteIds: Array.isArray(e.athlete_ids) ? e.athlete_ids : [],
        workoutTemplateId: e.workout_template_id
      },
      source: 'Supabase'
    }));

    mergedEvents.forEach(({ evt, source }) => {
      if (evt.workoutTemplateId && !validTemplateIds.has(evt.workoutTemplateId)) {
        orphanCalendarCount++;
        cleanableCalendarIds.add(evt.id);
        findings.push({
          id: `cal-tpl-${evt.id}`,
          source,
          category: 'orphan_calendar',
          label: evt.title || 'Evento sin rutina destino',
          detail: `Apunta a plantilla inexistente (${evt.workoutTemplateId}).`,
          date: evt.startDate
        });
        return;
      }

      if (evt.athleteIds.length > 0 && evt.athleteIds.every((aid: string) => !activeAthleteIds.has(aid))) {
        orphanCalendarCount++;
        cleanableCalendarIds.add(evt.id);
        findings.push({
          id: `cal-ath-${evt.id}`,
          source,
          category: 'orphan_calendar',
          label: evt.title || 'Evento de atleta eliminado',
          detail: `Asociado a atleta(s) que ya no existen en el catálogo.`,
          date: evt.startDate
        });
        return;
      }

      if (evt.startDate && evt.startDate < cutoff30d) {
        const hasActivity = evt.athleteIds.some((aid: string) => activeLogDayKeys.has(`${aid}|${evt.startDate}`));
        if (!hasActivity) {
          stale30dCount++;
          cleanableCalendarIds.add(evt.id);
          findings.push({
            id: `cal-stale-${evt.id}`,
            source,
            category: 'stale_30d',
            label: evt.title || 'Evento > 30 días sin asistencia',
            detail: `Fecha ${evt.startDate} (> 30 días) sin series ni check-in registrado.`,
            date: evt.startDate
          });
        }
      }
    });

    // 4. Auditar logs (basura 0x0 sin nota y ejercicios huérfanos)
    const seenOrphanLogKeys = new Set<string>();
    const inspectLog = (row: any, source: 'localStorage' | 'Supabase') => {
      const w = Number(row.weight) || 0;
      const r = Number(row.reps) || 0;
      const notes = String(row.notes || '').trim();
      const exId = row.exerciseId || row.exercise_id || '';
      const tsDay = this.getLogServerDateIso(row.timestamp);

      if (exId === 'kinetix-session-done' || exId === 'kinetix-session-reopen') {
        if (tsDay && tsDay < cutoff30d) {
          stale30dCount++;
          if (source === 'Supabase' && row.id) cleanableCloudLogIds.add(String(row.id));
        }
        return;
      }

      if (w === 0 && r === 0 && !notes && exId !== 'kinetix-class-log') {
        trashSessionsCount++;
        if (source === 'Supabase' && row.id) cleanableCloudLogIds.add(String(row.id));
        findings.push({
          id: `log-trash-${source}-${row.id || `${exId}-${row.timestamp}`}`,
          source,
          category: 'trash_session',
          label: `Registro vacío (${exId || 'sin ejercicio'})`,
          detail: 'Log 0kg × 0 reps sin nota técnica.',
          date: tsDay
        });
      } else if (exId && exId !== 'kinetix-class-log' && !exerciseIdSet.has(exId)) {
        const sig = `${source}:${exId}`;
        if (!seenOrphanLogKeys.has(sig)) {
          seenOrphanLogKeys.add(sig);
          orphanExercisesCount++;
          findings.push({
            id: `log-ex-${sig}`,
            source,
            category: 'orphan_exercise',
            label: `ID de ejercicio huérfano: ${exId}`,
            detail: `Existen logs históricos referenciando este ID fuera de la biblioteca.`,
            date: tsDay
          });
        }
      }
    };

    localLogs.forEach(l => inspectLog(l, 'localStorage'));
    cloudLogs.forEach(l => inspectLog(l, 'Supabase'));

    return {
      scannedAt: new Date().toISOString(),
      cutoff30d,
      cloudChecked,
      localStats: {
        templatesCount: localTemplates.length,
        logsCount: localLogs.length,
        calendarCount: localCalendar.length,
        exercisesCount: exercises.length,
        usedKB: this.getStorageUsage().usedKB
      },
      cloudStats: cloudChecked
        ? {
            templatesCount: cloudTemplates.length,
            logsCount: cloudLogs.length,
            calendarCount: cloudCalendar.length,
            athletesCount: cloudAthletes.length
          }
        : undefined,
      trashSessionsCount,
      orphanExercisesCount,
      orphanCalendarCount,
      stale30dCount,
      findings,
      cleanableTemplateIds: Array.from(cleanableTemplateIds),
      cleanableCalendarIds: Array.from(cleanableCalendarIds),
      cleanableCloudLogIds: Array.from(cleanableCloudLogIds),
      cleanableLocalKeys
    };
  }

  async cleanIntegrityIssues(report: IntegrityScanReport): Promise<IntegrityCleanResult> {
    let removedTemplates = 0;
    let removedCalendarEvents = 0;
    let removedCloudLogs = 0;
    let removedLocalLogs = 0;
    let removedLocalKeys = 0;
    let cloudSynced = false;

    // 1. Limpiar llaves obsoletas locales
    report.cleanableLocalKeys.forEach(k => {
      if (localStorage.getItem(k) !== null) {
        localStorage.removeItem(k);
        removedLocalKeys++;
      }
    });

    // 2. Limpiar plantillas/instancias basura o >30d sin actividad en localStorage
    const tplSet = new Set(report.cleanableTemplateIds);
    if (tplSet.size > 0) {
      try {
        const localTpls: Workout[] = JSON.parse(localStorage.getItem(KEYS.WORKOUT_TEMPLATES) || '[]');
        const nextTpls = localTpls.filter(t => !tplSet.has(t.id));
        removedTemplates = localTpls.length - nextTpls.length;
        localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(nextTpls));
        this.writeTemplatesCacheMeta('staff');
      } catch {}
    }

    // 3. Limpiar eventos de calendario huérfanos o >30d sin actividad en localStorage
    const calSet = new Set(report.cleanableCalendarIds);
    if (calSet.size > 0) {
      try {
        const localCal = JSON.parse(localStorage.getItem(KEYS.CALENDAR) || '[]');
        if (Array.isArray(localCal)) {
          const nextCal = localCal.filter((e: any) => !calSet.has(e.id));
          removedCalendarEvents = localCal.length - nextCal.length;
          localStorage.setItem(KEYS.CALENDAR, JSON.stringify(nextCal));
        }
      } catch {}
    }

    // 4. Limpiar logs basura 0x0 sin nota en localStorage
    try {
      const localLogs = this.getAllLogs();
      const cleanedLogs = localLogs.filter(l => {
        const isGarbage =
          Number(l.weight) === 0 &&
          Number(l.reps) === 0 &&
          !String(l.notes || '').trim() &&
          l.exerciseId !== 'kinetix-class-log' &&
          l.exerciseId !== 'kinetix-session-done' &&
          l.exerciseId !== 'kinetix-session-reopen';
        return !isGarbage;
      });
      removedLocalLogs = localLogs.length - cleanedLogs.length;
      if (removedLocalLogs > 0) {
        localStorage.setItem(KEYS.LOG_HISTORY, JSON.stringify(cleanedLogs));
      }
    } catch {}

    // 5. Limpiar en Supabase los mismos registros detectados (en lotes seguros de 50)
    if (isSupabaseConfigured) {
      const chunkArray = <T,>(arr: T[], size = 50): T[][] => {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };
      try {
        for (const chunk of chunkArray(report.cleanableTemplateIds)) {
          const { error } = await supabase.from('kinetix_templates').delete().in('id', chunk);
          if (!error) removedTemplates += chunk.length;
        }
        for (const chunk of chunkArray(report.cleanableCalendarIds)) {
          const { error } = await supabase.from('kinetix_calendar').delete().in('id', chunk);
          if (!error) removedCalendarEvents += chunk.length;
        }
        for (const chunk of chunkArray(report.cleanableCloudLogIds)) {
          const { error } = await supabase.from('workout_logs').delete().in('id', chunk);
          if (!error) removedCloudLogs += chunk.length;
        }
        cloudSynced = true;
      } catch (e) {
        console.warn('Error limpiando registros en Supabase:', e);
      }
    }

    return {
      removedTemplates,
      removedCalendarEvents,
      removedCloudLogs,
      removedLocalLogs,
      removedLocalKeys,
      cloudSynced
    };
  }

  init(d: any) {
    // Limpieza automática de llaves caducadas / caché basura sin tocar datos reales
    this.cleanupStaleData();
  }

  saveStaff(s: any) {}
  getStaff(): User[] {
    return this.getAthletes().filter(u => u.role === 'coach');
  }

  saveBodyMetric(metric: BodyMetric) {
    const list = this.getBodyMetrics();
    const updated = [metric, ...list.filter(m => m.date !== metric.date)];
    localStorage.setItem(KEYS.BODY_METRICS, JSON.stringify(updated));
  }

  getBodyMetrics(): BodyMetric[] {
    try {
      const data = localStorage.getItem(KEYS.BODY_METRICS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  addOrUpdateExercise(exercise: Exercise) {
    const list = this.getExercises();
    const idx = list.findIndex(e => e.id === exercise.id);
    if (idx >= 0) list[idx] = exercise;
    else list.push(exercise);
    this.saveExercises(list);
  }

  deleteExercise(id: string) {
    const list = this.getExercises().filter(e => e.id !== id);
    this.saveExercises(list);
  }
  
  getAthleteInsights(): AthleteInsight[] {
    const athletes = this.getAthletes().filter(a => a.role === 'client');
    const logs = this.getAllLogs();
    const todayIso = this.getServerTodayIsoSync();
    const cutoff7d = new Date(Date.now() - 7 * 86400000).toISOString();

    return athletes.map((ath): AthleteInsight => {
      const athLogs = logs
        .filter(
          l =>
            l.athleteId === ath.id &&
            (Number(l.weight) > 0 || Number(l.reps) > 0 || l.exerciseId === 'kinetix-class-log' || l.exerciseId === 'kinetix-session-done')
        )
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      const uniqueRecentDays = new Set(
        athLogs.filter(l => l.timestamp >= cutoff7d).map(l => this.getLogServerDateIso(l.timestamp))
      ).size;
      const targetDays = Math.max(1, ath.daysPerWeek || 4);
      const compliance = Math.min(100, Math.round((uniqueRecentDays / targetDays) * 100));

      const latestLog = athLogs[0];
      const latestRpe = athLogs.find(l => l.feedback?.rpe)?.feedback?.rpe;
      const isExpired = this.isMembershipExpired(ath, todayIso);

      if (ath.isActive === false) {
        return {
          athleteId: ath.id,
          athleteName: ath.name,
          message: 'Acceso pausado manualmente',
          status: 'warning',
          compliance,
          lastRpe: latestRpe,
          lastWorkoutDate: latestLog?.timestamp
        };
      }

      if (isExpired) {
        return {
          athleteId: ath.id,
          athleteName: ath.name,
          message: `Membresía vencida (${ath.cycleEndDate}) · Requiere renovación o Sin Corte`,
          status: 'critical',
          compliance,
          lastRpe: latestRpe,
          lastWorkoutDate: latestLog?.timestamp
        };
      }

      if (latestRpe && latestRpe >= 9) {
        return {
          athleteId: ath.id,
          athleteName: ath.name,
          message: `Esfuerzo elevado detectado (RPE @${latestRpe}) · Revisar recuperación`,
          status: 'critical',
          compliance,
          lastRpe: latestRpe,
          lastWorkoutDate: latestLog?.timestamp
        };
      }

      if (latestLog) {
        const diffDays = Math.floor((Date.now() - new Date(latestLog.timestamp).getTime()) / 86400000);
        if (diffDays >= 4) {
          return {
            athleteId: ath.id,
            athleteName: ath.name,
            message: `${diffDays} días sin registro de sesión`,
            status: 'warning',
            compliance,
            lastRpe: latestRpe,
            lastWorkoutDate: latestLog.timestamp
          };
        }
        return {
          athleteId: ath.id,
          athleteName: ath.name,
          message: `Entrenamiento al día · ${ath.medicalConditions || 'Kinetix'}`,
          status: 'normal',
          compliance: Math.max(compliance, 75),
          lastRpe: latestRpe,
          lastWorkoutDate: latestLog.timestamp
        };
      }

      return {
        athleteId: ath.id,
        athleteName: ath.name,
        message: 'Sin sesiones registradas aún · Listo para iniciar',
        status: 'normal',
        compliance: 0
      };
    }).sort((a, b) => {
      const rank = { critical: 0, warning: 1, normal: 2 };
      return rank[a.status] - rank[b.status];
    });
  }

  async saveUserSpecificWorkout(w: Workout) { await this.saveTemplate(w); }
}

export interface SystemConfig {
    enableAI: boolean;
    enableCloud: boolean;
}

export const storageService = new StorageService();
