// The rehearsal calendar. This is app content, not database rows: edit this file,
// commit, and the site redeploys. A season's roster, notices and attendance live
// in the database; its dates live here.
//
// To start a new season: add an entry to SEASON_BUILDERS (copy season 1), then set
// the database value `_meta.current_season` to the new number. The old season stays
// readable at /archive.

export interface SeasonDate {
  date: string;
  label: string;
  dayOfWeek: string;
  isPerformance: boolean;
  // When set, only people with one of these roles attend (others get an inert cell).
  roles?: string[];
  // A special session (e.g. a visiting coach) rather than a regular rehearsal.
  // Shown in a distinct colour; Coach-role people and the Operations team are included.
  coachVisit?: boolean;
  // Rehearsal hours and venue, shown on the calendar.
  time?: string;
  place?: PlaceKey;
}

export interface SeasonBreak {
  from: string;
  to: string;
}

export interface SeasonConfig {
  dates: SeasonDate[];
  // ISO datetime for the D-day countdown, or null when no show date is set yet.
  showStart: string | null;
  // What a cell with no saved answer means. "unset" starts everyone at
  // "not selected" (recommended); "yes" treats silence as attending.
  defaultStatus: "yes" | "unset";
  // Date ranges with no rehearsal at all (shown as a break on the calendar).
  breaks: SeasonBreak[];
}

// Venues. Add yours here and refer to the key in a season below.
// `address` feeds the map link; ko / en are the names shown to people.
export const PLACES = {
  studio: { address: "123 Example St, Springfield", ko: "스튜디오 A", en: "Studio A" },
  hall: { address: "456 Sample Ave, Springfield", ko: "홀", en: "Main Hall" },
} as const;
export type PlaceKey = keyof typeof PLACES;

function parts(date: string) {
  return new Date(date + "T12:00:00");
}

function label(date: string): string {
  return parts(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dayOfWeek(date: string): string {
  return parts(date).toLocaleDateString("en-US", { weekday: "short" });
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Every `weekday` (0 = Sunday … 6 = Saturday) from `start` to `end`, inclusive. */
function weekly(start: string, end: string, weekday = 0): string[] {
  const out: string[] = [];
  const d = parts(start);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  const last = parts(end);
  while (d <= last) {
    out.push(isoDate(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
}

const SEASON_BUILDERS: Record<number, () => SeasonConfig> = {
  // ── Season 1 (sample: replace with your own dates) ─────────────────────────
  1: () => {
    const regular: SeasonDate[] = weekly("2026-11-01", "2027-02-28", 0)
      // no rehearsal over the holidays
      .filter((d) => d < "2026-12-27" || d > "2027-01-03")
      .map((date) => ({
        date,
        label: label(date),
        dayOfWeek: dayOfWeek(date),
        isPerformance: false,
        time: "4–7 PM",
        place: "studio",
      }));

    // A one-off special session on a different day: open to leads and ensemble
    // (roles), plus Coach-role people and the Operations team.
    const special: SeasonDate = {
      date: "2026-11-19",
      label: label("2026-11-19"),
      dayOfWeek: dayOfWeek("2026-11-19"),
      isPerformance: false,
      roles: ["Main/Sub", "Ensemble"],
      coachVisit: true,
      time: "6–9 PM",
      place: "hall",
    };

    // Performance weekend. Performance dates show in amber and count down on the
    // header if `showStart` is set.
    const shows: SeasonDate[] = ["2027-03-12", "2027-03-13", "2027-03-14"].map((date) => ({
      date,
      label: label(date),
      dayOfWeek: dayOfWeek(date),
      isPerformance: true,
    }));

    return {
      dates: [...regular, special, ...shows].sort((a, b) => a.date.localeCompare(b.date)),
      showStart: "2027-03-12T19:00:00",
      defaultStatus: "unset",
      breaks: [{ from: "2026-12-27", to: "2027-01-03" }],
    };
  },
};

export function getSeasonConfig(season: number): SeasonConfig {
  const build = SEASON_BUILDERS[season] ?? SEASON_BUILDERS[1];
  return build();
}

// Whether a person is expected on a date — false renders an inert, greyed cell.
export function attends(person: { name: string; role: string | null; department?: string }, d: SeasonDate): boolean {
  if (person.role === "Coach") return true;
  if (d.coachVisit) {
    // the Operations team (stored as "marketing") joins special sessions
    return person.department === "marketing" || !!d.roles?.includes(person.role ?? "");
  }
  return !d.roles || d.roles.includes(person.role ?? "");
}
