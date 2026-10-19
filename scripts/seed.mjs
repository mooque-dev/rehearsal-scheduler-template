// Fills an empty database with a small, fictional company so you can see the app
// working before you enter your own people.
//
//   npm run seed            seed only if there are no people yet
//   npm run seed -- --reset wipe people, attendance, notices and the update log first
//
// Needs DATABASE_URL (in .env.local or the environment) and Node 22.18+ (it imports
// the app's own TypeScript schema bootstrap, so the tables always match the app).
import { readFileSync, existsSync } from "node:fs";
import pg from "pg";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file) || process.env.DATABASE_URL) continue;
  const m = readFileSync(file, "utf8").match(/^DATABASE_URL=["']?([^"'\n]+)["']?/m);
  if (m) process.env.DATABASE_URL = m[1];
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const { ensureSchema } = await import("../lib/db.ts");
await ensureSchema();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const SEASON = 1;
const reset = process.argv.includes("--reset");

try {
  if (reset) {
    await client.query("DELETE FROM absences");
    await client.query("DELETE FROM people WHERE season = $1", [SEASON]);
    await client.query("DELETE FROM notices WHERE season = $1", [SEASON]);
    await client.query("DELETE FROM update_log WHERE season = $1", [SEASON]);
  } else {
    const { rows } = await client.query("SELECT count(*)::int AS n FROM people WHERE season = $1", [SEASON]);
    if (rows[0].n > 0) {
      console.log(`Season ${SEASON} already has ${rows[0].n} people. Run "npm run seed -- --reset" to start over.`);
      process.exit(0);
    }
  }

  // [name, department, role, team, character_name, also_role]
  // roles: Main/Sub · Ensemble · Coach (actors tab only). Coach specialty uses spec:music|vocal|acting.
  const people = [
    ["Avery Chen", "actors", "Main/Sub", "A"],
    ["Jordan Lee", "actors", "Main/Sub", "A"],
    ["Sam Rivera", "actors", "Main/Sub", "A"],
    ["Riley Park", "actors", "Main/Sub", "B"],
    ["Morgan Diaz", "actors", "Main/Sub", "B", null, "Ensemble"],
    ["Casey Nguyen", "actors", "Main/Sub", "B"],
    ["Taylor Brooks", "actors", "Ensemble"],
    ["Quinn Adams", "actors", "Ensemble"],
    ["Drew Patel", "actors", "Ensemble"],
    ["Parker Wells", "actors", "Ensemble"],
    ["Dana Foster", "actors", "Coach", null, "spec:music", "Ensemble"],
    ["Elliot Ward", "actors", "Coach", null, "spec:acting"],
    ["Robin Hayes", "production", null],
    ["Skyler Moon", "production", null],
    ["Jamie Ortiz", "production", null],
    ["Alex Kim", "marketing", null],
    ["Blake Turner", "marketing", null],
    ["Cameron Shah", "marketing", null],
  ];
  let order = 0;
  for (const [name, department, role, team = null, character = null, also = null] of people) {
    await client.query(
      "INSERT INTO people (name, role, sort_order, team, character_name, also_role, department, season) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [name, role, ++order, team, character, also, department, SEASON]
    );
  }

  const maps = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  const notices = [
    ["First rehearsal & welcome", `4–7 PM · Studio A · [Map](${maps("123 Example St, Springfield")})\nIntroductions, the season plan and signing the company agreement.`, "2026-11-01", "4–7 PM"],
    ["Guest coach visit", "A visiting coach is joining the cast. Please mark your attendance.", "2026-11-19", "6–9 PM"],
    ["No rehearsal over the holidays", "We take a break from Dec 27 to Jan 3 and return on Jan 10.", "2026-12-27", null],
  ];
  for (const [title, content, date, time] of notices) {
    await client.query(
      "INSERT INTO notices (title, content, notice_date, time_info, pinned, season) VALUES ($1,$2,$3,$4,true,$5)",
      [title, content, date, time, SEASON]
    );
  }
  console.log(`Seeded ${people.length} people and ${notices.length} notices for season ${SEASON}.`);
} finally {
  await client.end();
}
process.exit(0);
