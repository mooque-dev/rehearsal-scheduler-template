export type Department = "actors" | "marketing" | "production";

export interface Person {
  id: number;
  name: string;
  role: string | null;
  sort_order: number;
  team: string | null;
  character_name: string | null;
  /** a second group this person also belongs to, e.g. a coach who also sings in the ensemble */
  also_role?: string | null;
  department: string;
  season: number;
}

export interface Absence {
  id: number;
  person_id: number;
  date: string;
  status: string;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  notice_date: string;
  time_info: string | null;
  people_names: string | null;
  pinned: boolean;
  created_at: string;
  season: number;
}

export interface LogChange {
  person: string;
  date: string;
  /** the status the date was changed to; null when an old entry doesn't say */
  to: "yes" | "maybe" | "no" | "unset" | null;
}

export interface UpdateLogEntry {
  id: number;
  saved_by: string;
  summary: string;
  created_at: string;
  changes_json: string | null;
  reverted: boolean;
  season: number;
  /** who's date changed, resolved server-side from changes_json */
  details?: LogChange[];
}
