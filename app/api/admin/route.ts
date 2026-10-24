import { NextRequest, NextResponse } from "next/server";
import { query, ensureSchema, getCurrentSeason, withTransaction, DbNotConfiguredError, type Q } from "@/lib/db";
import { verifyAdminToken, isDemo, ADMIN_COOKIE } from "@/lib/adminAuth";
import { getSiteSettings, getDefaultStatus, getBrand, setMeta } from "@/lib/data";
import { normalizeBrand } from "@/lib/brand";
import { weeklyDates, inBreak } from "@/lib/season";
import { seedSample } from "@/lib/seed";
import type { AdminState } from "@/lib/adminTypes";

// Everything the /admin page edits for the current season, behind the admin
// session cookie. One POST endpoint with an `action`; every action answers with
// the fresh state so the page never has to guess.

const ROLES = ["Main/Sub", "Ensemble", "Coach"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

class BadRequest extends Error {}

function text(v: unknown, max: number, required = false): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) {
    if (required) throw new BadRequest("missing_field");
    return null;
  }
  if (s.length > max) throw new BadRequest("too_long");
  return s;
}

function date(v: unknown): string {
  if (typeof v !== "string" || !DATE.test(v) || Number.isNaN(Date.parse(v))) throw new BadRequest("invalid_date");
  return v;
}

function id(v: unknown): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new BadRequest("invalid_id");
  return n;
}

function optionalId(v: unknown): number | null {
  return v === null || v === undefined || v === "" ? null : id(v);
}

function list(v: unknown, allowed?: string[]): string | null {
  if (!Array.isArray(v) || v.length === 0) return null;
  const items = v.map(String).filter((x) => (allowed ? allowed.includes(x) : /^[a-z0-9_-]{1,40}$/.test(x)));
  return items.length ? JSON.stringify(items) : null;
}

function slug(name: string): string {
  const s = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return s || "team";
}

async function loadState(season: number): Promise<AdminState> {
  const [site, defaultStatus, brand, teams, venues, sessions, breaks, people, notices] = await Promise.all([
    getSiteSettings(),
    getDefaultStatus(),
    getBrand(),
    query<AdminState["teams"][number]>(
      `SELECT t.id, t.key, t.name_en, t.name_ko, t.uses_roles, t.sort_order,
              (SELECT count(*)::int FROM people p WHERE p.season = t.season AND p.department = t.key) AS members
         FROM teams t WHERE t.season = $1 ORDER BY t.sort_order, t.id`,
      [season]
    ),
    query<AdminState["venues"][number]>("SELECT id, name, address FROM venues ORDER BY name"),
    query<AdminState["sessions"][number] & { teams: string | null; roles: string | null }>(
      "SELECT id, date, title, time, venue_id, is_performance, special, all_hands, teams, roles FROM sessions WHERE season = $1 ORDER BY date",
      [season]
    ),
    query<AdminState["breaks"][number]>(
      "SELECT id, from_date AS \"from\", to_date AS \"to\", label FROM breaks WHERE season = $1 ORDER BY from_date",
      [season]
    ),
    query<AdminState["people"][number]>(
      "SELECT id, name, department, role, team, character_name, also_role, sort_order FROM people WHERE season = $1 ORDER BY sort_order, id",
      [season]
    ),
    query<AdminState["notices"][number]>(
      "SELECT id, title, content, notice_date, time_info FROM notices WHERE season = $1 ORDER BY notice_date",
      [season]
    ),
  ]);
  const parse = (v: string | null) => (v ? (JSON.parse(v) as string[]) : null);
  return {
    season,
    demo: isDemo(),
    site,
    defaultStatus,
    brand,
    teams,
    venues,
    sessions: sessions.map((s) => ({ ...s, teams: parse(s.teams as string | null), roles: parse(s.roles as string | null) })),
    breaks,
    people,
    notices,
  };
}

function authed(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
}

function failure(e: unknown) {
  if (e instanceof BadRequest) return NextResponse.json({ error: e.message }, { status: 400 });
  if (e instanceof DbNotConfiguredError) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  const code = (e as { code?: string })?.code;
  if (code === "23505") return NextResponse.json({ error: "duplicate" }, { status: 409 });
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    await ensureSchema();
    return NextResponse.json(await loadState(await getCurrentSeason()));
  } catch (e) {
    return failure(e);
  }
}

async function move(q: Q, table: "teams" | "people", rowId: number, dir: number, season: number, scope?: string) {
  const rows = await q<{ id: number }>(
    table === "teams"
      ? "SELECT id FROM teams WHERE season = $1 ORDER BY sort_order, id"
      : "SELECT id FROM people WHERE season = $1 AND department = $2 ORDER BY sort_order, id",
    table === "teams" ? [season] : [season, scope]
  );
  const ids = rows.map((r) => r.id);
  const i = ids.indexOf(rowId);
  const j = i + (dir < 0 ? -1 : 1);
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  for (const [k, rid] of ids.entries()) await q(`UPDATE ${table} SET sort_order = $1 WHERE id = $2`, [k + 1, rid]);
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    await ensureSchema();
    const season = await getCurrentSeason();
    let note: string | undefined;

    await withTransaction(async (q) => {
      switch (b.action) {
        case "settings.save": {
          const en = text(b.titleEn, 80, true)!;
          await setMeta("site_title_en", en);
          await setMeta("site_title_ko", text(b.titleKo, 80) ?? en);
          await setMeta("default_status", b.defaultStatus === "yes" ? "yes" : "unset");
          break;
        }

        case "team.save": {
          const nameEn = text(b.name_en, 40, true)!;
          const nameKo = text(b.name_ko, 40) ?? nameEn;
          const usesRoles = b.uses_roles === true;
          if (b.id) {
            await q("UPDATE teams SET name_en = $1, name_ko = $2, uses_roles = $3 WHERE id = $4 AND season = $5", [
              nameEn, nameKo, usesRoles, id(b.id), season,
            ]);
          } else {
            const existing = new Set((await q<{ key: string }>("SELECT key FROM teams WHERE season = $1", [season])).map((r) => r.key));
            const base = slug(nameEn);
            let key = base;
            for (let n = 2; existing.has(key); n++) key = `${base}-${n}`;
            const [{ max }] = await q<{ max: number }>("SELECT coalesce(max(sort_order), 0) AS max FROM teams WHERE season = $1", [season]);
            await q("INSERT INTO teams (season, key, name_en, name_ko, uses_roles, sort_order) VALUES ($1,$2,$3,$4,$5,$6)", [
              season, key, nameEn, nameKo, usesRoles, max + 1,
            ]);
          }
          break;
        }
        case "team.move": {
          await move(q, "teams", id(b.id), Number(b.dir), season);
          break;
        }
        case "team.delete": {
          const [team] = await q<{ key: string }>("SELECT key FROM teams WHERE id = $1 AND season = $2", [id(b.id), season]);
          if (!team) break;
          const [{ n }] = await q<{ n: number }>("SELECT count(*)::int AS n FROM people WHERE season = $1 AND department = $2", [season, team.key]);
          if (n > 0) throw new BadRequest("team_not_empty");
          await q("DELETE FROM teams WHERE id = $1", [id(b.id)]);
          break;
        }

        case "person.save": {
          const name = text(b.name, 60, true)!;
          const dept = text(b.department, 40, true)!;
          const [team] = await q<{ uses_roles: boolean }>("SELECT uses_roles FROM teams WHERE season = $1 AND key = $2", [season, dept]);
          if (!team) throw new BadRequest("unknown_team");
          const role = team.uses_roles && ROLES.includes(String(b.role)) ? String(b.role) : null;
          const abTeam = team.uses_roles && (b.team === "A" || b.team === "B") ? b.team : null;
          const also = team.uses_roles && ROLES.includes(String(b.also_role)) && b.also_role !== role ? String(b.also_role) : null;
          const character = text(b.character_name, 60);
          if (b.id) {
            const pid = id(b.id);
            const [before] = await q<{ department: string }>("SELECT department FROM people WHERE id = $1 AND season = $2", [pid, season]);
            if (!before) throw new BadRequest("unknown_person");
            let order: number | null = null;
            if (before.department !== dept) {
              const [{ max }] = await q<{ max: number }>("SELECT coalesce(max(sort_order), 0) AS max FROM people WHERE season = $1 AND department = $2", [season, dept]);
              order = max + 1;
            }
            await q(
              "UPDATE people SET name = $1, department = $2, role = $3, team = $4, character_name = $5, also_role = $6, sort_order = coalesce($7, sort_order) WHERE id = $8",
              [name, dept, role, abTeam, character, also, order, pid]
            );
          } else {
            const [{ max }] = await q<{ max: number }>("SELECT coalesce(max(sort_order), 0) AS max FROM people WHERE season = $1 AND department = $2", [season, dept]);
            await q(
              "INSERT INTO people (name, department, role, team, character_name, also_role, sort_order, season) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
              [name, dept, role, abTeam, character, also, max + 1, season]
            );
          }
          break;
        }
        case "person.move": {
          const [p] = await q<{ department: string }>("SELECT department FROM people WHERE id = $1 AND season = $2", [id(b.id), season]);
          if (p) await move(q, "people", id(b.id), Number(b.dir), season, p.department);
          break;
        }
        case "person.delete": {
          await q("DELETE FROM people WHERE id = $1 AND season = $2", [id(b.id), season]);
          break;
        }

        case "session.save": {
          const d = date(b.date);
          const fields = [
            text(b.title, 60),
            text(b.time, 40),
            optionalId(b.venue_id),
            b.is_performance === true,
            b.special === true,
            b.all_hands === true,
            list(b.teams),
            list(b.roles, ROLES),
          ];
          if (b.id) {
            const sid = id(b.id);
            const [before] = await q<{ date: string }>("SELECT date FROM sessions WHERE id = $1 AND season = $2", [sid, season]);
            if (!before) throw new BadRequest("unknown_session");
            await q(
              `UPDATE sessions SET date = $1, title = $2, time = $3, venue_id = $4, is_performance = $5, special = $6,
                      all_hands = $7, teams = $8, roles = $9 WHERE id = $10`,
              [d, ...fields, sid]
            );
            // answers follow the date when it moves
            if (before.date !== d) {
              await q(
                `UPDATE absences SET date = $1 WHERE date = $2
                    AND person_id IN (SELECT id FROM people WHERE season = $3)
                    AND NOT EXISTS (SELECT 1 FROM absences a2 WHERE a2.person_id = absences.person_id AND a2.date = $1)`,
                [d, before.date, season]
              );
            }
          } else {
            await q(
              `INSERT INTO sessions (season, date, title, time, venue_id, is_performance, special, all_hands, teams, roles)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
              [season, d, ...fields]
            );
          }
          break;
        }
        case "session.delete": {
          const [s] = await q<{ date: string }>("DELETE FROM sessions WHERE id = $1 AND season = $2 RETURNING date", [id(b.id), season]);
          if (s) await q("DELETE FROM absences WHERE date = $1 AND person_id IN (SELECT id FROM people WHERE season = $2)", [s.date, season]);
          break;
        }
        case "cycle.create": {
          const start = date(b.start);
          const end = date(b.end);
          if (end < start) throw new BadRequest("end_before_start");
          const weekday = Number(b.weekday);
          if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new BadRequest("invalid_weekday");
          const every = Number(b.every) === 2 ? 2 : 1;
          const breaks = (await q<{ from_date: string; to_date: string }>("SELECT from_date, to_date FROM breaks WHERE season = $1", [season])).map(
            (r) => ({ from: r.from_date, to: r.to_date })
          );
          const dates = weeklyDates(start, end, weekday, every).filter((d) => !(b.skipBreaks !== false && inBreak(d, breaks)));
          const title = text(b.title, 60);
          const time = text(b.time, 40);
          const venue = optionalId(b.venue_id);
          let added = 0;
          for (const d of dates) {
            const r = await q(
              "INSERT INTO sessions (season, date, title, time, venue_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (season, date) DO NOTHING RETURNING id",
              [season, d, title, time, venue]
            );
            added += r.length;
          }
          note = `added:${added}:${dates.length - added}`;
          break;
        }

        case "break.save": {
          const from = date(b.from);
          const to = date(b.to);
          if (to < from) throw new BadRequest("end_before_start");
          const label = text(b.label, 60);
          if (b.id) await q("UPDATE breaks SET from_date = $1, to_date = $2, label = $3 WHERE id = $4 AND season = $5", [from, to, label, id(b.id), season]);
          else await q("INSERT INTO breaks (season, from_date, to_date, label) VALUES ($1,$2,$3,$4)", [season, from, to, label]);
          break;
        }
        case "break.delete": {
          await q("DELETE FROM breaks WHERE id = $1 AND season = $2", [id(b.id), season]);
          break;
        }

        case "venue.save": {
          const name = text(b.name, 60, true)!;
          const address = text(b.address, 160);
          if (b.id) await q("UPDATE venues SET name = $1, address = $2 WHERE id = $3", [name, address, id(b.id)]);
          else await q("INSERT INTO venues (name, address) VALUES ($1,$2)", [name, address]);
          break;
        }
        case "venue.delete": {
          await q("DELETE FROM venues WHERE id = $1", [id(b.id)]);
          break;
        }

        case "notice.save": {
          const fields = [text(b.title, 120, true), text(b.content, 4000) ?? "", date(b.notice_date), text(b.time_info, 60)];
          if (b.id) await q("UPDATE notices SET title = $1, content = $2, notice_date = $3, time_info = $4 WHERE id = $5 AND season = $6", [...fields, id(b.id), season]);
          else await q("INSERT INTO notices (title, content, notice_date, time_info, pinned, season) VALUES ($1,$2,$3,$4,true,$5)", [...fields, season]);
          break;
        }
        case "notice.delete": {
          await q("DELETE FROM notices WHERE id = $1 AND season = $2", [id(b.id), season]);
          break;
        }

        case "brand.save": {
          const current = await getBrand();
          // the logo is managed by its own actions; keep whatever is stored
          await setMeta("brand", JSON.stringify({ ...normalizeBrand(b.brand), logoVersion: current.logoVersion }));
          break;
        }
        case "brand.logo": {
          const m = typeof b.dataUrl === "string" ? b.dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/) : null;
          if (!m) throw new BadRequest("invalid_image");
          const bytes = Buffer.from(m[1], "base64");
          // a real PNG, at most 400 KB (the browser resizes to 512 px before sending)
          if (bytes.length > 400_000 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new BadRequest("invalid_image");
          await q(
            "INSERT INTO assets (key, mime, data) VALUES ('logo', 'image/png', $1) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()",
            [bytes]
          );
          await setMeta("brand", JSON.stringify({ ...(await getBrand()), logoVersion: Date.now() }));
          break;
        }
        case "brand.logoRemove": {
          await q("DELETE FROM assets WHERE key = 'logo'");
          await setMeta("brand", JSON.stringify({ ...(await getBrand()), logoVersion: null }));
          break;
        }

        case "demo.reset": {
          if (!isDemo()) throw new BadRequest("not_demo");
          await seedSample(q, season);
          await q("DELETE FROM assets WHERE key = 'logo'");
          await q("DELETE FROM _meta WHERE key = 'brand'");
          break;
        }

        default:
          throw new BadRequest("unknown_action");
      }
    });

    return NextResponse.json({ ...(await loadState(season)), note });
  } catch (e) {
    return failure(e);
  }
}
