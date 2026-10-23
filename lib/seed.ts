// The sample company used by `npm run seed` and by "Reset demo" on /admin.
// Plain TypeScript with no path aliases, so Node can run it directly too.
import type { Q } from "./db";

const WEEKDAY_SUNDAY = 0;

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function sundays(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(start + "T12:00:00");
  while (d.getDay() !== WEEKDAY_SUNDAY) d.setDate(d.getDate() + 1);
  const last = new Date(end + "T12:00:00");
  while (d <= last) {
    out.push(iso(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
}

/** Wipes the given season and fills it with the sample company. */
export async function seedSample(q: Q, season = 1): Promise<{ people: number; dates: number; notices: number }> {
  await q("DELETE FROM absences WHERE person_id IN (SELECT id FROM people WHERE season = $1)", [season]);
  for (const table of ["people", "notices", "update_log", "teams", "sessions", "breaks"]) {
    await q(`DELETE FROM ${table} WHERE season = $1`, [season]);
  }
  await q("DELETE FROM venues WHERE id NOT IN (SELECT venue_id FROM sessions WHERE venue_id IS NOT NULL)");

  const settings: [string, string][] = [
    ["site_title_en", "My Production 2026"],
    ["site_title_ko", "My Production 2026"],
    ["default_status", "unset"],
  ];
  for (const [k, v] of settings) {
    await q("INSERT INTO _meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [k, v]);
  }

  // Teams: the key is stored on each person; the names are what people see.
  const teams: [string, string, string, boolean][] = [
    ["cast", "Cast", "배우팀", true],
    ["creative", "Creative", "연출팀", false],
    ["ops", "Operations", "운영팀", false],
  ];
  for (const [i, [key, en, ko, roles]] of teams.entries()) {
    await q("INSERT INTO teams (season, key, name_en, name_ko, uses_roles, sort_order) VALUES ($1,$2,$3,$4,$5,$6)", [season, key, en, ko, roles, i]);
  }

  const [studio] = await q<{ id: number }>("INSERT INTO venues (name, address) VALUES ('Studio A', '123 Example St, Springfield') RETURNING id");
  const [hall] = await q<{ id: number }>("INSERT INTO venues (name, address) VALUES ('Main Hall', '456 Sample Ave, Springfield') RETURNING id");

  const breakFrom = "2026-12-27";
  const breakTo = "2027-01-03";
  await q("INSERT INTO breaks (season, from_date, to_date, label) VALUES ($1,$2,$3,$4)", [season, breakFrom, breakTo, "Holiday break"]);

  // Weekly Sunday rehearsals, skipping the break.
  const regular = sundays("2026-11-01", "2027-02-28").filter((d) => d < breakFrom || d > breakTo);
  for (const date of regular) {
    await q("INSERT INTO sessions (season, date, title, time, venue_id) VALUES ($1,$2,'Rehearsal','4–7 PM',$3)", [season, date, studio.id]);
  }
  await q("UPDATE sessions SET title = 'Act 1 check', all_hands = true WHERE season = $1 AND date = '2026-12-20'", [season]);
  // A special session on a weekday, only for the cast's leads and ensemble.
  await q(
    "INSERT INTO sessions (season, date, title, time, venue_id, special, teams, roles) VALUES ($1,'2026-11-19','Guest coach visit','6–9 PM',$2,true,$3,$4)",
    [season, hall.id, JSON.stringify(["cast"]), JSON.stringify(["Main/Sub", "Ensemble"])]
  );
  for (const date of ["2027-03-12", "2027-03-13", "2027-03-14"]) {
    await q("INSERT INTO sessions (season, date, title, venue_id, is_performance, all_hands) VALUES ($1,$2,'Performance',$3,true,true)", [season, date, hall.id]);
  }

  // [name, team, role, A/B, character or coach specialty, second group]
  const people: [string, string, string | null, string | null, string | null, string | null][] = [
    ["Avery Chen", "cast", "Main/Sub", "A", null, null],
    ["Jordan Lee", "cast", "Main/Sub", "A", null, null],
    ["Sam Rivera", "cast", "Main/Sub", "A", null, null],
    ["Riley Park", "cast", "Main/Sub", "B", null, null],
    ["Morgan Diaz", "cast", "Main/Sub", "B", null, "Ensemble"],
    ["Casey Nguyen", "cast", "Main/Sub", "B", null, null],
    ["Taylor Brooks", "cast", "Ensemble", null, null, null],
    ["Quinn Adams", "cast", "Ensemble", null, null, null],
    ["Drew Patel", "cast", "Ensemble", null, null, null],
    ["Parker Wells", "cast", "Ensemble", null, null, null],
    ["Dana Foster", "cast", "Coach", null, "spec:music", "Ensemble"],
    ["Elliot Ward", "cast", "Coach", null, "spec:acting", null],
    ["Robin Hayes", "creative", null, null, null, null],
    ["Skyler Moon", "creative", null, null, null, null],
    ["Jamie Ortiz", "creative", null, null, null, null],
    ["Alex Kim", "ops", null, null, null, null],
    ["Blake Turner", "ops", null, null, null, null],
    ["Cameron Shah", "ops", null, null, null, null],
  ];
  for (const [i, [name, dept, role, team, character, also]] of people.entries()) {
    await q(
      "INSERT INTO people (name, role, sort_order, team, character_name, also_role, department, season) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [name, role, i + 1, team, character, also, dept, season]
    );
  }

  const maps = (addr: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  const notices: [string, string, string, string | null][] = [
    ["First rehearsal & welcome", `4–7 PM · Studio A · [Map](${maps("123 Example St, Springfield")})\nIntroductions, the season plan and signing the company agreement.`, "2026-11-01", "4–7 PM"],
    ["Guest coach visit", "A visiting coach is joining the cast. Please mark your attendance.", "2026-11-19", "6–9 PM"],
    ["No rehearsal over the holidays", "We take a break from Dec 27 to Jan 3 and return on Jan 10.", "2026-12-27", null],
  ];
  for (const [title, content, date, time] of notices) {
    await q("INSERT INTO notices (title, content, notice_date, time_info, pinned, season) VALUES ($1,$2,$3,$4,true,$5)", [title, content, date, time, season]);
  }
  return { people: people.length, dates: regular.length + 4, notices: notices.length };
}
