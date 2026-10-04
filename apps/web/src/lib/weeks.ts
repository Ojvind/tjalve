import type { Plan, Session } from './types';
import { addDays, isoWeekNumber, mondayOf } from './format';

export interface DayEntry {
  date: string;
  session?: Session;
}

export interface WeekGroup {
  index: number;
  isoWeek: number;
  days: DayEntry[];
}

export function buildWeeks(plan: Plan): WeekGroup[] {
  if (plan.sessions.length === 0) return [];
  const byDate = new Map(plan.sessions.map((s) => [s.date, s]));
  const dates = plan.sessions.map((s) => s.date).sort();
  const lastDate = dates[dates.length - 1];

  const weeks: WeekGroup[] = [];
  let cursor = mondayOf(dates[0]);
  let index = 1;
  while (cursor <= lastDate) {
    const days: DayEntry[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(cursor, i);
      days.push({ date, session: byDate.get(date) });
    }
    weeks.push({ index, isoWeek: isoWeekNumber(cursor), days });
    cursor = addDays(cursor, 7);
    index++;
  }
  return weeks;
}
