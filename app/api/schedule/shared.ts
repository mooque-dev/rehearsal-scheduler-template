import { query, ensureSchema } from "@/lib/db";
import type { SeasonBreak, SeasonDate, SiteSettings, Team } from "@/lib/season";
import { getBreaks, getDefaultStatus, getSeasonDates, getSiteSettings, getTeams } from "@/lib/data";
import type { Person, Absence, Notice, UpdateLogEntry, LogChange } from "@/lib/types";

export interface ScheduleResponse {
  people: Person[];
  dates: SeasonDate[];
  showStart: string | null;
  defaultStatus: "yes" | "unset";
  breaks: SeasonBreak[];
  teams: Team[];
  site: SiteSettings;
  responses: { person_id: number; date: string; status: string }[];
  logs: UpdateLogEntry[];
  notices: Notice[];
}

type Status = "yes" | "maybe" | "no" | "unset";
const SUMMARY_TO_STATUS: Record<string, Status> = { absent: "no", maybe: "maybe", attending: "yes" };

interface StoredChanges {
  prevStatuses?: { person_id: number; date: string; status: Status }[];
  changes?: { person_id: number; date: string; status: Status }[];
}

function parseChanges(json: string | null): StoredChanges | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as StoredChanges;
  } catch {
    return null;
  }
}

// Entries saved before `changes` was recorded only kept the PREVIOUS status
// per date. The new one is still recoverable from the summary ("marked absent
// on 2 date(s), marked attending on 1 date(s)"): it can't equal the previous
// status, so if exactly one of the summary's statuses differs, that's it.
function inferTo(prev: Status, summary: string): Status | null {
  const named = new Set<Status>();
  for (const m of summary.matchAll(/marked (absent|maybe|attending)/g)) named.add(SUMMARY_TO_STATUS[m[1]]);
  const candidates = [...named].filter((s) => s !== prev);
  return candidates.length === 1 ? candidates[0] : null;
}

/** Resolve who each save touched, so the log can say "X marked Y absent". */
async function withDetails(logs: UpdateLogEntry[]): Promise<UpdateLogEntry[]> {
  const parsed = logs.map((l) => parseChanges(l.changes_json));
  const ids = new Set<number>();
  for (const p of parsed) {
    for (const c of p?.changes ?? p?.prevStatuses ?? []) ids.add(c.person_id);
  }
  const names = new Map<number, string>();
  if (ids.size > 0) {
    const rows = await query<{ id: number; name: string }>(
      "SELECT id, name FROM people WHERE id = ANY($1::int[])",
      [[...ids]]
    );
    for (const r of rows) names.set(r.id, r.name);
  }
  return logs.map((log, i) => {
    const p = parsed[i];
    let details: LogChange[] | undefined;
    if (p?.changes?.length) {
      details = p.changes.map((c) => ({ person: names.get(c.person_id) ?? "?", date: c.date, to: c.status }));
    } else if (p?.prevStatuses?.length) {
      details = p.prevStatuses.map((c) => ({
        person: names.get(c.person_id) ?? "?",
        date: c.date,
        to: inferTo(c.status, log.summary),
      }));
    }
    return details ? { ...log, details } : log;
  });
}

export async function loadSchedule(department: string, season: number): Promise<ScheduleResponse> {
  await ensureSchema();
  const [people, responses, logs, notices] = await Promise.all([
    query<Person>(
      "SELECT * FROM people WHERE department = $1 AND season = $2 ORDER BY sort_order",
      [department, season]
    ),
    query<Absence>(
      `SELECT a.person_id, a.date, a.status FROM absences a
       JOIN people p ON p.id = a.person_id
       WHERE p.department = $1 AND p.season = $2`,
      [department, season]
    ),
    query<UpdateLogEntry>(
      "SELECT * FROM update_log WHERE season = $1 ORDER BY created_at DESC LIMIT 200",
      [season]
    ),
    query<Notice>("SELECT * FROM notices WHERE season = $1 ORDER BY notice_date DESC", [season]),
  ]);
  const [dates, breaks, teams, site, defaultStatus] = await Promise.all([
    getSeasonDates(season),
    getBreaks(season),
    getTeams(season),
    getSiteSettings(),
    getDefaultStatus(),
  ]);
  const firstShow = dates.find((d) => d.isPerformance);
  return {
    people,
    dates,
    showStart: firstShow ? `${firstShow.date}T00:00:00` : null,
    defaultStatus,
    breaks,
    teams,
    site,
    responses,
    logs: await withDetails(logs),
    notices,
  };
}
