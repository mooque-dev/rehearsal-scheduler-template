// Fills the database with a small, fictional company so you can see the app
// working before you enter your own people (you can then change everything on /admin).
//
//   npm run seed            seed only if the current season has no people yet
//   npm run seed -- --reset wipe the current season and load the sample again
//
// Needs DATABASE_URL (in .env.local or the environment) and Node 22.18+ (it runs
// the app's own TypeScript, so the tables always match the app).
import { readFileSync, existsSync } from "node:fs";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file) || process.env.DATABASE_URL) continue;
  const m = readFileSync(file, "utf8").match(/^DATABASE_URL=["']?([^"'\n]+)["']?/m);
  if (m) process.env.DATABASE_URL = m[1];
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  process.exit(1);
}

const { ensureSchema, getCurrentSeason, query, withTransaction } = await import("../lib/db.ts");
const { seedSample } = await import("../lib/seed.ts");

await ensureSchema();
const season = await getCurrentSeason();
const [{ n }] = await query("SELECT count(*)::int AS n FROM people WHERE season = $1", [season]);
if (n > 0 && !process.argv.includes("--reset")) {
  console.log(`Season ${season} already has ${n} people. Run "npm run seed -- --reset" to start over.`);
  process.exit(0);
}
const result = await withTransaction((q) => seedSample(q, season));
console.log(`Seeded season ${season}: ${result.people} people, ${result.dates} dates, ${result.notices} notices.`);
process.exit(0);
