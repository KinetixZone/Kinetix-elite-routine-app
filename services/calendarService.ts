
import { CalendarEvent, Workout, User } from '../types/kinetix';
import { storageService } from './storageService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

class CalendarService {
  private STORAGE_KEY = 'kinetix_calendar';

  getLocalDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private mapRowToEvent(row: any): CalendarEvent {
    return {
      id: row.id,
      type: row.type || 'workout',
      title: row.title || 'Entrenamiento Kinetix',
      start: row.start_at,
      end: row.end_at || row.start_at,
      allDay: row.all_day !== false,
      coachId: row.coach_id || 'jorge',
      athleteIds: Array.isArray(row.athlete_ids) ? row.athlete_ids : [],
      workoutTemplateId: row.workout_template_id || undefined,
      location: row.location || undefined
    };
  }

  private pushEventsToCloud(eventsToPush: CalendarEvent[]) {
    if (!isSupabaseConfigured || eventsToPush.length === 0) return;
    const rows = eventsToPush.map(e => ({
      id: e.id,
      type: e.type,
      title: e.title,
      start_at: e.start,
      end_at: e.end,
      all_day: e.allDay,
      coach_id: e.coachId,
      athlete_ids: e.athleteIds,
      workout_template_id: e.workoutTemplateId || null,
      location: e.location || null
    }));
    supabase.from('kinetix_calendar').upsert(rows).then(({ error }) => {
      if (error) console.warn('Calendar cloud upsert skipped:', error.message);
    });
  }

  async syncCalendarFromCloud(athleteId?: string): Promise<CalendarEvent[]> {
    const local = this.getEvents();
    if (!isSupabaseConfigured) return local;
    try {
      const { data, error } = await supabase.from('kinetix_calendar').select('*');
      if (error || !data) return local;
      const cloudEvents = data.map(r => this.mapRowToEvent(r));
      const filtered = athleteId
        ? cloudEvents.filter(e => e.athleteIds.includes(athleteId))
        : cloudEvents;

      const map = new Map<string, CalendarEvent>();
      local.forEach(e => map.set(e.id, e));
      filtered.forEach(ce => map.set(ce.id, ce));
      const merged = Array.from(map.values());
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch (e) {
      return local;
    }
  }

  getEvents(): CalendarEvent[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveEvent(event: CalendarEvent) {
    const events = this.getEvents().filter(e => e.id !== event.id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify([...events, event]));
    this.pushEventsToCloud([event]);
  }

  deleteEvent(eventId: string) {
    const events = this.getEvents().filter(e => e.id !== eventId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
    if (isSupabaseConfigured) {
      supabase.from('kinetix_calendar').delete().eq('id', eventId).then(({ error }) => {
        if (error) console.warn('Calendar delete skipped:', error.message);
      });
    }
  }

  clearDaySessions(athleteId: string, dateStr: string) {
    const all = this.getEvents();
    const toDelete: string[] = [];
    const events = all.filter(e => {
        const eDate = e.start.split('T')[0];
        const isTargetDay = eDate === dateStr;
        const isTargetAthlete = e.athleteIds.includes(athleteId);
        const isWorkout = e.type === 'workout';
        if (isTargetDay && isTargetAthlete && isWorkout) {
          toDelete.push(e.id);
          return false;
        }
        return true;
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
    if (isSupabaseConfigured && toDelete.length > 0) {
      supabase.from('kinetix_calendar').delete().in('id', toDelete).then(() => {});
    }
  }

  getScheduledSession(date: Date, userId: string): string | null {
    const events = this.getEvents();
    const targetDateStr = this.getLocalDateStr(date);

    const session = events.find(e => {
        const eventDateStr = e.start.split('T')[0];
        return eventDateStr === targetDateStr && e.athleteIds.includes(userId) && e.type === 'workout';
    });

    return session?.workoutTemplateId || null;
  }

  batchScheduleVenue(athleteId: string, startDateStr: string, weeks: number, targetDays: number[], isVenue: boolean): number {
      const events = this.getEvents();
      const pushed: CalendarEvent[] = [];
      let count = 0;
      const baseDate = new Date(`${startDateStr}T12:00:00`); 

      for (let w = 0; w < weeks; w++) {
          targetDays.forEach(dayIdx => {
              const currentBase = new Date(baseDate);
              currentBase.setDate(baseDate.getDate() + (w * 7));
              const diff = dayIdx - currentBase.getDay();
              const targetDate = new Date(currentBase);
              targetDate.setDate(currentBase.getDate() + diff);
              
              const targetStr = this.getLocalDateStr(targetDate);
              
              const existingIdx = events.findIndex(e => e.start.startsWith(targetStr) && e.athleteIds.includes(athleteId));

              if (existingIdx >= 0) {
                  events[existingIdx].location = isVenue ? 'Kinetix Functional Zone' : undefined;
                  pushed.push(events[existingIdx]);
                  count++;
              } else if (isVenue) {
                  const id = `class-${athleteId}-${targetStr}`;
                  const newEvent: CalendarEvent = {
                      id: `evt-${id}`,
                      type: 'workout',
                      title: 'Kinetix Class',
                      start: `${targetStr}T12:00:00`,
                      end: `${targetStr}T13:00:00`,
                      allDay: true,
                      coachId: 'system',
                      athleteIds: [athleteId],
                      workoutTemplateId: id,
                      location: 'Kinetix Functional Zone'
                  };
                  storageService.saveUserSpecificWorkout({
                      id: id, name: 'Kinetix Class', day: 1, exercises: [], isTemplate: false, scheduledDate: targetStr
                  });
                  events.push(newEvent);
                  pushed.push(newEvent);
                  count++;
              }
          });
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
      this.pushEventsToCloud(pushed);
      return count;
  }

  projectMesocycle(template: Workout, user: User, days: number[], startStr: string, weeks: number, location?: string, offsetDays: number = 0): any {
      let events = this.getEvents();
      const pushed: CalendarEvent[] = [];
      const replacedIds: string[] = [];
      const baseDate = new Date(`${startStr}T12:00:00`);
      baseDate.setDate(baseDate.getDate() + offsetDays);
      
      let added = 0;
      const eventTitle = template.publicTitle || template.name;

      for(let w=0; w<weeks; w++) {
          days.forEach(dayIdx => {
              const currentBase = new Date(baseDate);
              currentBase.setDate(baseDate.getDate() + (w*7));
              
              const diff = dayIdx - currentBase.getDay();
              const targetDate = new Date(currentBase);
              targetDate.setDate(currentBase.getDate() + diff);
              
              const dateStr = this.getLocalDateStr(targetDate);

              // Reemplazar asignación previa en ese día para ese atleta para evitar asignaciones mudas
              events = events.filter(e => {
                const sameDayAthlete = e.start.startsWith(dateStr) && e.athleteIds.includes(user.id) && e.type === 'workout';
                if (sameDayAthlete) replacedIds.push(e.id);
                return !sameDayAthlete;
              });

              const newEvt: CalendarEvent = {
                  id: `meso-${user.id}-${dateStr}-${template.id}`,
                  type: 'workout',
                  title: eventTitle,
                  start: `${dateStr}T12:00:00`,
                  end: `${dateStr}T13:00:00`,
                  allDay: true,
                  coachId: 'jorge',
                  athleteIds: [user.id],
                  workoutTemplateId: template.id,
                  location: location
              };
              events.push(newEvt);
              pushed.push(newEvt);
              added++;
          });
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
      if (isSupabaseConfigured && replacedIds.length > 0) {
        supabase.from('kinetix_calendar').delete().in('id', replacedIds).then(() => {});
      }
      this.pushEventsToCloud(pushed);
      return { success: true, added, message: 'Proyección exitosa' };
  }
}

export const calendarService = new CalendarService();
