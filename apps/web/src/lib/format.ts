const DAY_SHORT = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];
const DAY_LONG = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];
const MONTH_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MONTH_LONG = [
  'januari',
  'februari',
  'mars',
  'april',
  'maj',
  'juni',
  'juli',
  'augusti',
  'september',
  'oktober',
  'november',
  'december',
];

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function mondayOf(s: string): string {
  const d = parseDate(s);
  const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
  return addDays(s, -day);
}

export function isoWeekNumber(s: string): number {
  const d = parseDate(s);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const diff = (d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7);
  return 1 + Math.round(diff / 7);
}

export function shortDate(s: string): string {
  const d = parseDate(s);
  return `${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]}`;
}

export function longDate(s: string): string {
  const d = parseDate(s);
  return `${DAY_LONG[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function dayShort(s: string): string {
  return DAY_SHORT[parseDate(s).getUTCDay()];
}

export function dayNumber(s: string): number {
  return parseDate(s).getUTCDate();
}

export function todayStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

export function formatDuration(m: number): string {
  if (m <= 0) return '';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return `${h} h${rest ? ' ' + rest + ' min' : ''}`;
}

export const SPORT_LABEL: Record<string, string> = {
  running: 'Löpning',
  cycling: 'Cykling',
  rollerski: 'Rullskidor',
  'skate-ski': 'Skidor',
  'ice-skate': 'Skridskor',
  'ski-erg': 'Stakmaskin',
  crosstrainer: 'Crosstrainer',
  strength: 'Styrka',
  mobility: 'Rörlighet',
  walk: 'Promenad',
  cross: 'Valfri form',
  rest: 'Vila',
  race: 'Lopp',
};
