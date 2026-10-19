import { NextRequest, NextResponse } from "next/server";
import { query, ensureSchema, getCurrentSeason, DbNotConfiguredError } from "@/lib/db";
import { loadSchedule } from "./shared";
import { getSeasonConfig } from "@/lib/season";
import type { DepartmentKey } from "@/lib/i18n";

const VALID_DEPARTMENTS: DepartmentKey[] = ["actors", "production", "marketing"];

function isValidDepartment(d: string | null): d is DepartmentKey {
  return !!d && (VALID_DEPARTMENTS as string[]).includes(d);
}

export async function GET(req: NextRequest) {
  const department = req.nextUrl.searchParams.get("department");
  if (!isValidDepartment(department)) {
    return NextResponse.json({ error: "invalid department" }, { status: 400 });
  }
  try {
    const season = await getCurrentSeason();
    const data = await loadSchedule(department, season);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof DbNotConfiguredError) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

interface StatusChange {
  person_id: number;
  date: string;
  status: "yes" | "maybe" | "no" | "unset";
}
interface RoleChange {
  personId: number;
  role: string | null;
}

const MAX_STATUS_CHANGES = 600;
const MAX_ROLE_CHANGES = 100;
const MAX_NAME_LENGTH = 60;
const MAX_REASON_LENGTH = 300;
const VALID_ROLES = ["Main/Sub", "Ensemble", "Coach"];

const STATUS_LABEL: Record<string, string> = { no: "absent", maybe: "maybe", yes: "attending", unset: "cleared" };

export async function POST(req: NextRequest) {
  let body: {
    savedBy?: string;
    statusChanges?: StatusChange[];
    roleChanges?: RoleChange[];
    department?: string;
    reason?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { savedBy, statusChanges = [], roleChanges = [], department, reason } = body;
  if (!savedBy?.trim() || !isValidDepartment(department ?? null)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (statusChanges.length === 0 && roleChanges.length === 0) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }
  // size caps: a real save is a handful of cells; this keeps a scripted flood cheap to reject
  if (
    !Array.isArray(statusChanges) ||
    !Array.isArray(roleChanges) ||
    statusChanges.length > MAX_STATUS_CHANGES ||
    roleChanges.length > MAX_ROLE_CHANGES ||
    savedBy.trim().length > MAX_NAME_LENGTH ||
    (reason ?? "").length > MAX_REASON_LENGTH
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (statusChanges.some((c) => c.status !== "yes" && c.status !== "no" && c.status !== "unset")) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  if (statusChanges.some((c) => c.status === "no") && !reason?.trim()) {
    return NextResponse.json({ error: "reason_required" }, { status: 400 });
  }

  try {
    await ensureSchema();
    const season = await getCurrentSeason();
    const defaultStatus = getSeasonConfig(season).defaultStatus;
    // "unset" only exists in seasons that start everyone at "not selected"
    if (defaultStatus === "yes" && statusChanges.some((c) => c.status === "unset")) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }

    // every cell and role edit must name a real person on this team and season,
    // and a date on this season's calendar
    const members = await query<{ id: number }>(
      "SELECT id FROM people WHERE season = $1 AND department = $2",
      [season, department]
    );
    const memberIds = new Set(members.map((m) => m.id));
    const seasonDates = new Set(getSeasonConfig(season).dates.map((d) => d.date));
    const statusOk = statusChanges.every((c) => memberIds.has(c.person_id) && seasonDates.has(c.date));
    const rolesOk = roleChanges.every(
      (r) => memberIds.has(r.personId) && (r.role === null || VALID_ROLES.includes(r.role))
    );
    if (!statusOk || !rolesOk) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const prevStatuses: StatusChange[] = [];
    for (const c of statusChanges) {
      const existing = await query<{ status: string }>(
        "SELECT status FROM absences WHERE person_id = $1 AND date = $2",
        [c.person_id, c.date]
      );
      prevStatuses.push({
        person_id: c.person_id,
        date: c.date,
        status: (existing[0]?.status as StatusChange["status"]) ?? defaultStatus,
      });
      // a cell with no row means the season's default; only differing answers are stored
      if (c.status === defaultStatus || c.status === "unset") {
        await query("DELETE FROM absences WHERE person_id = $1 AND date = $2", [
          c.person_id,
          c.date,
        ]);
      } else if (existing[0]) {
        await query("UPDATE absences SET status = $1 WHERE person_id = $2 AND date = $3", [
          c.status,
          c.person_id,
          c.date,
        ]);
      } else {
        await query(
          "INSERT INTO absences (person_id, date, status) VALUES ($1, $2, $3)",
          [c.person_id, c.date, c.status]
        );
      }
    }

    const prevRoles: RoleChange[] = [];
    for (const rc of roleChanges) {
      const existing = await query<{ role: string | null }>(
        "SELECT role FROM people WHERE id = $1",
        [rc.personId]
      );
      prevRoles.push({ personId: rc.personId, role: existing[0]?.role ?? null });
      await query("UPDATE people SET role = $1 WHERE id = $2", [rc.role, rc.personId]);
    }

    const counts: Record<string, number> = {};
    for (const c of statusChanges) counts[c.status] = (counts[c.status] ?? 0) + 1;
    const parts: string[] = [];
    for (const key of ["no", "maybe", "yes", "unset"] as const) {
      if (counts[key]) parts.push(`marked ${STATUS_LABEL[key]} on ${counts[key]} date(s)`);
    }
    if (roleChanges.length > 0) {
      parts.push(`updated role for ${roleChanges.length} ${roleChanges.length === 1 ? "person" : "people"}`);
    }
    let summary = parts.join(", ");
    if (reason?.trim()) summary += ` — reason: ${reason.trim()}`;

    await query(
      "INSERT INTO update_log (saved_by, summary, changes_json, season) VALUES ($1, $2, $3, $4)",
      [savedBy.trim(), summary, JSON.stringify({ defaultStatus, prevStatuses, prevRoles, changes: statusChanges, reason: reason?.trim() || null }), season]
    );

    const data = await loadSchedule(department!, season);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof DbNotConfiguredError) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
