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
  id: string;
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

export interface PlanSummary {
  _id: string;
  slug: string;
  title: string;
  goal: string;
  raceDate?: string | null;
  startDate: string;
}

export interface Plan extends PlanSummary {
  phases?: PlanPhase[];
  rules?: string[];
  weeklyChecks?: string[];
  exclusions?: string[];
  emergency?: string;
  restLabel?: string;
  sessions: Session[];
}

export interface ProgressEntry {
  sessionId: string;
  doneAt: string;
  note?: string;
}
