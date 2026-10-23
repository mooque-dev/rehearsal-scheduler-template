// Shapes shared by the server and the browser for a season's calendar. The
// calendar itself lives in the database (sessions, breaks, venues) and is edited
// on the /admin page; this file only describes it and decides who attends what.

export interface SeasonDate {
  date: string;
  label: string;
  dayOfWeek: string;
  isPerformance: boolean;
  /** what happens that day, e.g. "Run-through" (free text, shown on the calendar) */
  title?: string;
  /** hours, free text, e.g. "4–7 PM" */
  time?: string;
  venue?: { name: string; address: string | null };
  /** a special session: shown in violet (e.g. a visiting coach) */
  special?: boolean;
  /** everyone is expected: marked with a ★ */
  allHands?: boolean;
  /** only these team keys attend (others get an inert, greyed cell); unset = every team */
  teams?: string[];
  /** in teams that use roles, only these roles attend; unset = every role */
  roles?: string[];
}

export interface SeasonBreak {
  from: string;
  to: string;
  label?: string | null;
}

export interface Team {
  key: string;
  name_en: string;
  name_ko: string;
  /** group people by role (leads / ensemble / coaches) and show role controls */
  uses_roles: boolean;
  sort_order: number;
}

export interface SiteSettings {
  title: { en: string; ko: string };
}

function at(date: string) {
  return new Date(date + "T12:00:00");
}

export function dateLabel(date: string): string {
  return at(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function dayOfWeek(date: string): string {
  return at(date).toLocaleDateString("en-US", { weekday: "short" });
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Every `weekday` (0 = Sunday … 6 = Saturday) from `start` to `end`, inclusive. */
export function weeklyDates(start: string, end: string, weekday: number, everyWeeks = 1): string[] {
  const out: string[] = [];
  const d = at(start);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  const last = at(end);
  while (d <= last && out.length < 400) {
    out.push(isoDate(d));
    d.setDate(d.getDate() + 7 * Math.max(1, everyWeeks));
  }
  return out;
}

export function inBreak(date: string, breaks: SeasonBreak[]): boolean {
  return breaks.some((b) => date >= b.from && date <= b.to);
}

/** Whether a person is expected on a date — false renders an inert, greyed cell. */
export function attends(
  person: { role: string | null; department?: string },
  d: SeasonDate,
  roleTeams?: Set<string>
): boolean {
  if (d.teams?.length && !d.teams.includes(person.department ?? "")) return false;
  const usesRoles = roleTeams ? roleTeams.has(person.department ?? "") : true;
  if (usesRoles && d.roles?.length) return d.roles.includes(person.role ?? "");
  return true;
}
