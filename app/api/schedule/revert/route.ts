import { NextRequest, NextResponse } from "next/server";
import { query, ensureSchema, getCurrentSeason, DbNotConfiguredError } from "@/lib/db";
import { loadSchedule } from "../shared";
import { checkRevertPassword } from "@/lib/adminAuth";
import type { DepartmentKey } from "@/lib/i18n";

const VALID_DEPARTMENTS: DepartmentKey[] = ["actors", "production", "marketing"];

export async function POST(req: NextRequest) {
  let body: { logId?: number; revertedBy?: string; department?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { logId, revertedBy, department, password } = body;
  if (!logId || !revertedBy?.trim() || !(VALID_DEPARTMENTS as string[]).includes(department ?? "")) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const auth = checkRevertPassword(password);
  if (auth === "disabled") return NextResponse.json({ error: "revert_disabled" }, { status: 503 });
  if (auth === "wrong") return NextResponse.json({ error: "wrong_password" }, { status: 401 });

  try {
    await ensureSchema();
    const season = await getCurrentSeason();
    const rows = await query<{
      id: number;
      summary: string;
      changes_json: string | null;
      reverted: boolean;
    }>("SELECT id, summary, changes_json, reverted FROM update_log WHERE id = $1 AND season = $2", [
      logId,
      season,
    ]);
    const log = rows[0];
    if (!log) return NextResponse.json({ error: "log_not_found" }, { status: 404 });
    if (log.reverted) return NextResponse.json({ error: "already_reverted" }, { status: 400 });
    if (!log.changes_json) return NextResponse.json({ error: "not_revertible" }, { status: 400 });

    const changes: {
      defaultStatus?: string;
      prevStatuses?: { person_id: number; date: string; status: string }[];
      prevRoles?: { personId: number; role: string | null }[];
    } = JSON.parse(log.changes_json);

    for (const s of changes.prevStatuses ?? []) {
      // entries from before "not selected" existed treat a missing row as attending
      const entryDefault = changes.defaultStatus ?? "yes";
      if (s.status === entryDefault || s.status === "unset") {
        await query("DELETE FROM absences WHERE person_id = $1 AND date = $2", [
          s.person_id,
          s.date,
        ]);
      } else {
        const existing = await query<{ id: number }>(
          "SELECT id FROM absences WHERE person_id = $1 AND date = $2",
          [s.person_id, s.date]
        );
        if (existing[0]) {
          await query("UPDATE absences SET status = $1 WHERE id = $2", [s.status, existing[0].id]);
        } else {
          await query("INSERT INTO absences (person_id, date, status) VALUES ($1, $2, $3)", [
            s.person_id,
            s.date,
            s.status,
          ]);
        }
      }
    }
    for (const r of changes.prevRoles ?? []) {
      await query("UPDATE people SET role = $1 WHERE id = $2", [r.role, r.personId]);
    }

    await query("UPDATE update_log SET reverted = true WHERE id = $1", [logId]);
    await query(
      "INSERT INTO update_log (saved_by, summary, changes_json, season) VALUES ($1, $2, NULL, $3)",
      [revertedBy.trim(), `Reverted: ${log.summary}`, season]
    );

    const data = await loadSchedule(department as DepartmentKey, season);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof DbNotConfiguredError) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
