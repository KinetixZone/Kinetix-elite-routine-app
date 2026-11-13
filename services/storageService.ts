
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
}

export interface MuscleStatus {
  zone: string;
  status: 'fatigued' | 'recovering' | 'optimal';
  level: number;
}

export interface AthleteInsight {
  athleteName: string;
  message: string;
  status: 'critical' | 'warning' | 'normal';
  compliance: number;
  lastRpe?: number;
  lastWorkoutDate?: string;
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
          payPortalUrl: 'https://kinetix-progress.vercel.app/'
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
  }

  getSystemConfig() {
      const data = localStorage.getItem(KEYS.SYSTEM_CONFIG);
      return data ? JSON.parse(data) : { enableAI: true, enableCloud: true };
  }

  saveUser(user: User) { localStorage.setItem(KEYS.USER, JSON.stringify(user)); }
  getUser(): User | null {
    const data = localStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  }
  logout() { localStorage.removeItem(KEYS.USER); }

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
      preferred_unit: normalizedUser.preferredUnit || 'kg'
    };

    try {
      const { error } = await supabase.from('athletes').upsert(fullPayload);
      if (error) {
        // Fallback para tablas v7.2 que aún no ejecutan el SQL v7.3
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
        return { ok: true, error: 'Actualiza el SQL v7.3 en Admin > Sistema para sincronizar usuarios/claves en todos los dispositivos.' };
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

  // NUEVO: getTemplates ahora es asíncrono para consultar Supabase (Sincronización multi-dispositivo)
  async getTemplates(athleteId?: string): Promise<Workout[]> {
    let templates: Workout[] = [];

    // 1. Intentar cargar desde Supabase si está configurado
    if (isSupabaseConfigured) {
        try {
            const query = supabase.from('kinetix_templates').select('*');
            if (athleteId) {
                // PRIVACIDAD: El atleta solo descarga lo suyo
                query.or(`assignedTo.eq.${athleteId},category.eq.travel`);
            }
            const { data, error } = await query;
            if (!error && data && data.length > 0) {
                templates = data as Workout[];
                // Actualizar cache local
                localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(templates));
                return templates;
            }
        } catch (e) { console.warn("Supabase Fetch Error, usando LocalStorage", e); }
    }

    // 2. Fallback a LocalStorage si no hay nube o falla
    const localData = localStorage.getItem(KEYS.WORKOUT_TEMPLATES);
    if (localData) {
      try {
        templates = JSON.parse(localData);
      } catch (e) {
        templates = [];
      }
    }
    
    // Si no hay plantillas, sembrar las plantillas preguardadas maestras
    if (!templates || templates.length === 0) {
      templates = [...PRESET_WORKOUT_TEMPLATES];
      localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(templates));
    }
    
    if (athleteId) {
        return templates.filter(t => t.assignedTo === athleteId || t.category === 'travel' || t.isTemplate);
    }
    return templates;
  }

  // NUEVO: saveTemplate ahora es asíncrono para subir a Supabase
  async saveTemplate(template: Workout) {
    const localTemplates = JSON.parse(localStorage.getItem(KEYS.WORKOUT_TEMPLATES) || '[]');
    const idx = localTemplates.findIndex((t: any) => t.id === template.id);
    if (idx >= 0) localTemplates[idx] = template; else localTemplates.push(template);
    localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(localTemplates));

    if (isSupabaseConfigured) {
        try {
            await supabase.from('kinetix_templates').upsert(template);
        } catch (e) { console.error("Error al sincronizar con Nube", e); }
    }
  }

  async deleteTemplate(templateId: string) {
    const localTemplates: Workout[] = JSON.parse(localStorage.getItem(KEYS.WORKOUT_TEMPLATES) || '[]');
    const filtered = localTemplates.filter(t => t.id !== templateId);
    localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(filtered));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('kinetix_templates').delete().eq('id', templateId);
      } catch (e) { console.error("Error al eliminar en Nube", e); }
    }
  }

  async replaceAllTemplates(templates: Workout[]) {
    localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(templates));
    if (isSupabaseConfigured) {
      try {
        for (const tpl of templates) {
          await supabase.from('kinetix_templates').upsert(tpl);
        }
      } catch (e) { console.error("Error al sincronizar restauración", e); }
    }
  }

  getWorkoutById(id: string): Workout | undefined {
    const data = localStorage.getItem(KEYS.WORKOUT_TEMPLATES);
    const all: Workout[] = data ? JSON.parse(data) : [];
    return all.find(w => w.id === id);
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

  saveSessionLogs(logs: WorkoutLog[]) {
    const currentLogs = this.getAllLogs();
    const currentPRs = this.getPRs();
    const exercises = this.getExercises();

    const processedLogs = logs.map(log => {
      const w = Number(log.weight) || 0;
      const r = Number(log.reps) || 0;
      if (w > 0 && r > 0 && log.exerciseId !== 'kinetix-class-log') {
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
            date: new Date().toISOString().split('T')[0]
          };
          this.savePR(newPR);
          return { ...log, isPR: true };
        }
      }
      return log;
    });

    localStorage.setItem(KEYS.LOG_HISTORY, JSON.stringify([...currentLogs, ...processedLogs]));

    if (isSupabaseConfigured && processedLogs.length > 0) {
      const cloudRows = processedLogs.map(l => ({
        athlete_id: l.athleteId || null,
        exercise_id: l.exerciseId,
        weight: Number(l.weight) || 0,
        reps: Number(l.reps) || 0,
        is_pr: !!l.isPR,
        timestamp: l.timestamp || new Date().toISOString()
      }));
      supabase.from('workout_logs').insert(cloudRows).then(({ error }) => {
        if (error) console.warn('Cloud log insert skipped:', error.message);
      });
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
      localStorage.setItem(KEYS.LOG_HISTORY, JSON.stringify(merged));
      return merged;
    } catch (e) {
      return local;
    }
  }

  getAllLogs(): WorkoutLog[] {
    const data = localStorage.getItem(KEYS.LOG_HISTORY);
    return data ? JSON.parse(data) : [];
  }

  getMuscleStatus(): MuscleStatus[] { 
    const logs = this.getAllLogs();
    const now = Date.now();
    const hours72 = 72 * 3600 * 1000;

    const recentLogs = logs.filter(l => {
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

  isSessionComplete(workoutId: string, athleteId?: string): boolean {
    const todayStr = new Date().toISOString().split('T')[0];
    if (athleteId) {
      const reopened = localStorage.getItem(`kinetix_reopened_${athleteId}`);
      if (reopened === todayStr) return false;
      const locked = localStorage.getItem(`kinetix_locked_${athleteId}_${todayStr}`);
      if (locked === workoutId) return true;
    }
    const data = localStorage.getItem(KEYS.COMPLETED_SESSIONS);
    const list = data ? JSON.parse(data) : [];
    return list.includes(workoutId);
  }

  isSessionReopenedByCoach(athleteId: string): boolean {
    const todayStr = new Date().toISOString().split('T')[0];
    return localStorage.getItem(`kinetix_reopened_${athleteId}`) === todayStr;
  }

  markSessionComplete(workoutId: string, athleteId?: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    if (athleteId) {
      localStorage.removeItem(`kinetix_reopened_${athleteId}`);
      localStorage.setItem(`kinetix_locked_${athleteId}_${todayStr}`, workoutId);
    }
    const data = localStorage.getItem(KEYS.COMPLETED_SESSIONS);
    const list = data ? JSON.parse(data) : [];
    if (!list.includes(workoutId)) {
        list.push(workoutId);
        localStorage.setItem(KEYS.COMPLETED_SESSIONS, JSON.stringify(list));
    }
  }

  reopenSessionForAthlete(athleteId: string, workoutId?: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(`kinetix_reopened_${athleteId}`, todayStr);
    localStorage.removeItem(`kinetix_locked_${athleteId}_${todayStr}`);
    if (workoutId) {
      const data = localStorage.getItem(KEYS.COMPLETED_SESSIONS);
      const list: string[] = data ? JSON.parse(data) : [];
      localStorage.setItem(KEYS.COMPLETED_SESSIONS, JSON.stringify(list.filter(id => id !== workoutId)));
    }
  }

  getLastPerformance(exId: string) {
      const logs = this.getAllLogs().filter(l => l.exerciseId === exId).sort((a,b) => b.timestamp.localeCompare(a.timestamp));
      return logs.length > 0 ? { weight: logs[0].weight, reps: logs[0].reps } : null;
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

  init(d: any) {
    // Seed initial body metrics if none exist
    if (!localStorage.getItem(KEYS.BODY_METRICS)) {
      const today = new Date();
      const defaultMetrics: BodyMetric[] = [
        { date: new Date(today.getTime() - 14 * 86400000).toISOString().split('T')[0], weight: 79.2, bodyFat: 15.2, waist: 82, chest: 101, arm: 38, thigh: 59 },
        { date: new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0], weight: 78.6, bodyFat: 14.8, waist: 81, chest: 102, arm: 38.5, thigh: 59.5 },
        { date: today.toISOString().split('T')[0], weight: 78.0, bodyFat: 14.4, waist: 80, chest: 102.5, arm: 39, thigh: 60 }
      ];
      localStorage.setItem(KEYS.BODY_METRICS, JSON.stringify(defaultMetrics));
    }
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
    return [
      { athleteName: 'Carlos R.', message: 'RPE Crítico detectado en Sentadilla', status: 'critical', compliance: 95, lastRpe: 10, lastWorkoutDate: new Date().toISOString() },
      { athleteName: 'Ana G.', message: '3 días sin actividad', status: 'warning', compliance: 40, lastWorkoutDate: new Date(Date.now() - 3 * 86400000).toISOString() }
    ];
  }

  async saveUserSpecificWorkout(w: Workout) { await this.saveTemplate(w); }
}

export interface SystemConfig {
    enableAI: boolean;
    enableCloud: boolean;
}

export const storageService = new StorageService();
