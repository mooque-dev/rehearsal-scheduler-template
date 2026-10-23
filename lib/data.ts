// Server-side loaders for the season setup that /admin edits.
import { query } from "@/lib/db";
import { SITE } from "@/lib/site.config";
import { dateLabel, dayOfWeek, type SeasonBreak, type SeasonDate, type SiteSettings, type Team } from "@/lib/season";

export async function getMeta(key: string): Promise<string | null> {
  const rows = await query<{ value: string | null }>("SELECT value FROM _meta WHERE key = $1", [key]);
  return rows[0]?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  await query(
    "INSERT INTO _meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [key, value]
  );
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const [en, ko] = await Promise.all([getMeta("site_title_en"), getMeta("site_title_ko")]);
  return { title: { en: en || SITE.title.en, ko: ko || en || SITE.title.ko } };
}

export async function getDefaultStatus(): Promise<"yes" | "unset"> {
  return (await getMeta("default_status")) === "yes" ? "yes" : "unset";
}

export async function getTeams(season: number): Promise<Team[]> {
  return query<Team>(
    "SELECT key, name_en, name_ko, uses_roles, sort_order FROM teams WHERE season = $1 ORDER BY sort_order, id",
    [season]
  );
}

function parseList(v: string | null): string[] | undefined {
  if (!v) return undefined;
  try {
    const list = JSON.parse(v);
    return Array.isArray(list) && list.length ? list.map(String) : undefined;
  } catch {
    return undefined;
  }
}

interface SessionRow {
  date: string;
  title: string | null;
  time: string | null;
  is_performance: boolean;
  special: boolean;
  all_hands: boolean;
  roles: string | null;
  teams: string | null;
  venue_name: string | null;
  venue_address: string | null;
}

export async function getSeasonDates(season: number): Promise<SeasonDate[]> {
  const rows = await query<SessionRow>(
    `SELECT s.date, s.title, s.time, s.is_performance, s.special, s.all_hands, s.roles, s.teams,
            v.name AS venue_name, v.address AS venue_address
       FROM sessions s LEFT JOIN venues v ON v.id = s.venue_id
      WHERE s.season = $1 ORDER BY s.date`,
    [season]
  );
  return rows.map((r) => ({
    date: r.date,
    label: dateLabel(r.date),
    dayOfWeek: dayOfWeek(r.date),
    isPerformance: r.is_performance,
    ...(r.title ? { title: r.title } : {}),
    ...(r.time ? { time: r.time } : {}),
    ...(r.venue_name ? { venue: { name: r.venue_name, address: r.venue_address } } : {}),
    ...(r.special ? { special: true } : {}),
    ...(r.all_hands ? { allHands: true } : {}),
    ...(parseList(r.teams) ? { teams: parseList(r.teams) } : {}),
    ...(parseList(r.roles) ? { roles: parseList(r.roles) } : {}),
  }));
}

export async function getBreaks(season: number): Promise<SeasonBreak[]> {
  const rows = await query<{ from_date: string; to_date: string; label: string | null }>(
    "SELECT from_date, to_date, label FROM breaks WHERE season = $1 ORDER BY from_date",
    [season]
  );
  return rows.map((b) => ({ from: b.from_date, to: b.to_date, label: b.label }));
}
