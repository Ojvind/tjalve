export type Sport =
  | 'running'
  | 'cycling'
  | 'rollerski'
  | 'skate-ski'
  | 'ice-skate'
  | 'ski-erg'
  | 'crosstrainer'
  | 'strength'
  | 'mobility'
  | 'walk'
  | 'cross'
  | 'rest'
  | 'race';

export interface StrengthBlock {
  title: string;
  durationMin: number;
  items: string[];
  note?: string;
}

export interface Session {
  id: string; // date, 'YYYY-MM-DD', unique within a plan
  date: string;
  sport: Sport;
  title: string;
  durationMin: number;
  intensity?: string;
  rest?: boolean;
  race?: boolean;
  phase?: number;
  steps: string[];
  purpose?: string;
  tips?: string[];
  strength?: StrengthBlock | null;
  snowFallback?: boolean;
}

export interface PlanPhase {
  n: number;
  name: string;
  dateRange: string;
  description: string;
}

export interface PlanDocument {
  _id?: string;
  userId: string;
  slug: string;
  title: string;
  goal: string;
  raceDate?: string | null;
  startDate: string;
  phases?: PlanPhase[];
  rules?: string[];
  weeklyChecks?: string[];
  exclusions?: string[];
  emergency?: string;
  /** Label shown for calendar days in range that have no session entry, e.g. "Vila och Tai Chi". */
  restLabel?: string;
  sessions: Session[];
  updatedAt: string;
}

export interface UserDocument {
  _id?: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

export interface ProgressDocument {
  _id?: string;
  userId: string;
  planId: string;
  sessionId: string;
  doneAt: string;
  note?: string;
}
