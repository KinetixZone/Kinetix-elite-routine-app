
import { CalendarEvent, Workout, User } from '../types/kinetix';
import { storageService } from './storageService';

class CalendarService {
  private STORAGE_KEY = 'kinetix_calendar';

  getLocalDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
  }

  deleteEvent(eventId: string) {
    const events = this.getEvents().filter(e => e.id !== eventId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
  }

  clearDaySessions(athleteId: string, dateStr: string) {
    let events = this.getEvents();
    events = events.filter(e => {
        const eDate = e.start.split('T')[0];
        const isTargetDay = eDate === dateStr;
        const isTargetAthlete = e.athleteIds.includes(athleteId);
        const isWorkout = e.type === 'workout';
        return !(isTargetDay && isTargetAthlete && isWorkout);
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
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
                  count++;
              }
          });
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
      return count;
  }

  projectMesocycle(template: Workout, user: User, days: number[], startStr: string, weeks: number, location?: string, offsetDays: number = 0): any {
      const events = this.getEvents();
      const baseDate = new Date(`${startStr}T12:00:00`);
      // Aplicamos el offset si viene de una creación de mesociclo progresivo
      baseDate.setDate(baseDate.getDate() + offsetDays);
      
      let added = 0;
      const eventTitle = template.publicTitle || template.name;

      for(let w=0; w<weeks; w++) {
          days.forEach(dayIdx => {
              const currentBase = new Date(baseDate);
              currentBase.setDate(baseDate.getDate() + (w*7));
              
              // Lógica de ajuste al día de la semana correcto
              let diff = dayIdx - currentBase.getDay();
              const targetDate = new Date(currentBase);
              targetDate.setDate(currentBase.getDate() + diff);
              
              const dateStr = this.getLocalDateStr(targetDate);

              if(!events.some(e => e.start.startsWith(dateStr) && e.athleteIds.includes(user.id))) {
                  events.push({
                      id: `meso-${user.id}-${dateStr}-${template.id}`,
                      type: 'workout',
                      title: eventTitle,
                      start: `${dateStr}T12:00:00`,
                      end: `${dateStr}T13:00:00`,
                      allDay: true,
                      coachId: 'system',
                      athleteIds: [user.id],
                      workoutTemplateId: template.id,
                      location: location
                  });
                  added++;
              }
          });
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
      return { success: true, added, message: 'Proyección exitosa' };
  }
}

export const calendarService = new CalendarService();
