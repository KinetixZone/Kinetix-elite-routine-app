
import { User, Workout, WorkoutLog, Exercise, BodyMetric, Goal, UserLevel, WorkoutExercise } from '../types/kinetix';
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
  EXERCISE_LIBRARY: 'kinetix_exercise_library_v2',
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

class StorageService {
  getBranding(): BrandingConfig {
      try {
          const data = localStorage.getItem(KEYS.BRANDING);
          return data ? JSON.parse(data) : { primaryColor: '#ef4444' };
      } catch (e) { return { primaryColor: '#ef4444' }; }
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
    return data ? JSON.parse(data) : [];
  }

  saveAthletes(athletes: User[]) { localStorage.setItem(KEYS.ATHLETES_DB, JSON.stringify(athletes)); }

  getExercises(): Exercise[] {
    const data = localStorage.getItem(KEYS.EXERCISE_LIBRARY);
    return data ? JSON.parse(data) : EXERCISES_DB;
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
            if (!error && data) {
                templates = data as Workout[];
                // Actualizar cache local
                localStorage.setItem(KEYS.WORKOUT_TEMPLATES, JSON.stringify(templates));
                return templates;
            }
        } catch (e) { console.warn("Supabase Fetch Error, usando LocalStorage", e); }
    }

    // 2. Fallback a LocalStorage si no hay nube o falla
    const localData = localStorage.getItem(KEYS.WORKOUT_TEMPLATES);
    templates = localData ? JSON.parse(localData) : [];
    
    if (athleteId) {
        return templates.filter(t => t.assignedTo === athleteId || t.category === 'travel');
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

  getWorkoutById(id: string): Workout | undefined {
    const data = localStorage.getItem(KEYS.WORKOUT_TEMPLATES);
    const all: Workout[] = data ? JSON.parse(data) : [];
    return all.find(w => w.id === id);
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

  saveSessionLogs(logs: WorkoutLog[]) {
    const current = this.getAllLogs();
    localStorage.setItem(KEYS.LOG_HISTORY, JSON.stringify([...current, ...logs]));
  }

  getAllLogs(): WorkoutLog[] {
    const data = localStorage.getItem(KEYS.LOG_HISTORY);
    return data ? JSON.parse(data) : [];
  }

  getMuscleStatus(): MuscleStatus[] { 
    return [
      { zone: 'Push', status: 'optimal', level: 90 },
      { zone: 'Pull', status: 'recovering', level: 60 },
      { zone: 'Legs', status: 'fatigued', level: 20 },
      { zone: 'Core', status: 'optimal', level: 85 }
    ];
  }

  isSessionComplete(workoutId: string): boolean {
    const data = localStorage.getItem(KEYS.COMPLETED_SESSIONS);
    const list = data ? JSON.parse(data) : [];
    return list.includes(workoutId);
  }

  markSessionComplete(workoutId: string) {
    const data = localStorage.getItem(KEYS.COMPLETED_SESSIONS);
    const list = data ? JSON.parse(data) : [];
    if (!list.includes(workoutId)) {
        list.push(workoutId);
        localStorage.setItem(KEYS.COMPLETED_SESSIONS, JSON.stringify(list));
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

  init(d: any) {}
  saveStaff(s: any) {}
  getStaff(): User[] { return []; }
  saveBodyMetric(m: any) {}
  getBodyMetrics(): BodyMetric[] { return []; }
  addOrUpdateExercise(e: any) {}
  deleteExercise(id: string) {}
  
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
