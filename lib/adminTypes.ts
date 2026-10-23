// What GET /api/admin returns: the editable setup of the current season.
import type { SiteSettings } from "@/lib/season";

export interface AdminState {
  season: number;
  demo: boolean;
  site: SiteSettings;
  defaultStatus: "yes" | "unset";
  teams: { id: number; key: string; name_en: string; name_ko: string; uses_roles: boolean; sort_order: number; members: number }[];
  venues: { id: number; name: string; address: string | null }[];
  sessions: {
    id: number;
    date: string;
    title: string | null;
    time: string | null;
    venue_id: number | null;
    is_performance: boolean;
    special: boolean;
    all_hands: boolean;
    teams: string[] | null;
    roles: string[] | null;
  }[];
  breaks: { id: number; from: string; to: string; label: string | null }[];
  people: {
    id: number;
    name: string;
    department: string;
    role: string | null;
    team: string | null;
    character_name: string | null;
    also_role: string | null;
    sort_order: number;
  }[];
  notices: { id: number; title: string; content: string; notice_date: string; time_info: string | null }[];
}
