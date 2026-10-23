import { Pool } from "pg";

export class DbNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured");
    this.name = "DbNotConfiguredError";
  }
}

let pool: Pool | null = null;

function getPool(): Pool {
  if (!process.env.DATABASE_URL) throw new DbNotConfiguredError();
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const p = getPool();
  const res = await p.query(text, params);
  return res.rows as T[];
}

let bootstrapped: Promise<void> | null = null;

// Additive, idempotent schema bootstrap: creates the tables on first use of an
// empty database, and adds newer columns to older ones. Safe to run every time.
export async function ensureSchema(): Promise<void> {
  if (!bootstrapped) {
    bootstrapped = (async () => {
      await query(`
        CREATE TABLE IF NOT EXISTS people (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT,
          sort_order INTEGER NOT NULL,
          team TEXT,
          character_name TEXT,
          department TEXT NOT NULL,
          season INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS absences (
          id SERIAL PRIMARY KEY,
          person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
          date TEXT NOT NULL,
          status TEXT NOT NULL,
          UNIQUE (person_id, date)
        );
        CREATE TABLE IF NOT EXISTS notices (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          notice_date TEXT NOT NULL,
          time_info TEXT,
          people_names TEXT,
          pinned BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          season INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS update_log (
          id SERIAL PRIMARY KEY,
          saved_by TEXT NOT NULL,
          summary TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          changes_json TEXT,
          reverted BOOLEAN NOT NULL DEFAULT false,
          season INTEGER NOT NULL DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS _meta (
          key TEXT PRIMARY KEY,
          value TEXT
        );
        -- Teams are the tabs (people.department holds a team's key).
        CREATE TABLE IF NOT EXISTS teams (
          id SERIAL PRIMARY KEY,
          season INTEGER NOT NULL DEFAULT 1,
          key TEXT NOT NULL,
          name_en TEXT NOT NULL,
          name_ko TEXT NOT NULL,
          uses_roles BOOLEAN NOT NULL DEFAULT false,
          sort_order INTEGER NOT NULL DEFAULT 0,
          UNIQUE (season, key)
        );
        CREATE TABLE IF NOT EXISTS venues (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT
        );
        -- One row per scheduled date (a column in the table).
        CREATE TABLE IF NOT EXISTS sessions (
          id SERIAL PRIMARY KEY,
          season INTEGER NOT NULL DEFAULT 1,
          date TEXT NOT NULL,
          title TEXT,
          time TEXT,
          venue_id INTEGER REFERENCES venues(id) ON DELETE SET NULL,
          is_performance BOOLEAN NOT NULL DEFAULT false,
          special BOOLEAN NOT NULL DEFAULT false,
          all_hands BOOLEAN NOT NULL DEFAULT false,
          roles TEXT,
          teams TEXT,
          UNIQUE (season, date)
        );
        CREATE TABLE IF NOT EXISTS breaks (
          id SERIAL PRIMARY KEY,
          season INTEGER NOT NULL DEFAULT 1,
          from_date TEXT NOT NULL,
          to_date TEXT NOT NULL,
          label TEXT
        );
      `);
      // a second group someone also belongs to (shown as a small badge on their one row)
      await query("ALTER TABLE people ADD COLUMN IF NOT EXISTS also_role TEXT");
      await query(
        `INSERT INTO _meta (key, value) VALUES ('current_season', '1')
         ON CONFLICT (key) DO NOTHING`
      );
    })();
  }
  return bootstrapped;
}

export type Q = <T = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<T[]>;

/** Run several statements atomically; `q` runs on one connection inside BEGIN/COMMIT. */
export async function withTransaction<R>(fn: (q: Q) => Promise<R>): Promise<R> {
  const client = await getPool().connect();
  const q: Q = async (text, params) => (await client.query(text, params)).rows;
  try {
    await client.query("BEGIN");
    const result = await fn(q);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getCurrentSeason(): Promise<number> {
  await ensureSchema();
  const rows = await query<{ value: string }>(
    "SELECT value FROM _meta WHERE key = 'current_season'"
  );
  return rows[0] ? parseInt(rows[0].value, 10) : 1;
}
