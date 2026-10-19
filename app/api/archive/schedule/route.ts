import { NextRequest, NextResponse } from "next/server";
import { DbNotConfiguredError } from "@/lib/db";
import { verifyToken, ARCHIVE_COOKIE } from "@/lib/archiveAuth";
import { loadSchedule } from "@/app/api/schedule/shared";
import type { DepartmentKey } from "@/lib/i18n";

const VALID_DEPARTMENTS: DepartmentKey[] = ["actors", "production", "marketing"];

function isValidDepartment(d: string | null): d is DepartmentKey {
  return !!d && (VALID_DEPARTMENTS as string[]).includes(d);
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ARCHIVE_COOKIE)?.value;
  if (!verifyToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const department = req.nextUrl.searchParams.get("department");
  if (!isValidDepartment(department)) {
    return NextResponse.json({ error: "invalid_department" }, { status: 400 });
  }
  try {
    const data = await loadSchedule(department, 1);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof DbNotConfiguredError) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
