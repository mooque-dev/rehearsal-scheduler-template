// Slows down password guessing on the sign-in and revert routes. Failures are
// counted per caller address in the database (serverless instances share
// nothing else). After MAX failures in WINDOW the route answers 429 until the
// window passes. If the database is unreachable the check lets the request
// through — the password check itself still applies.
import type { NextRequest } from "next/server";
import { query, ensureSchema } from "@/lib/db";

const MAX_FAILURES = 8;
const WINDOW_MINUTES = 10;

export function callerKey(req: NextRequest, scope: string): string {
  const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = fwd || req.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`.slice(0, 120);
}

export async function isBlocked(key: string): Promise<boolean> {
  try {
    await ensureSchema();
    const rows = await query<{ n: number }>(
      `SELECT count(*)::int AS n FROM login_attempts WHERE key = $1 AND at > now() - interval '${WINDOW_MINUTES} minutes'`,
      [key]
    );
    return (rows[0]?.n ?? 0) >= MAX_FAILURES;
  } catch {
    return false;
  }
}

export async function recordFailure(key: string): Promise<void> {
  try {
    await query("INSERT INTO login_attempts (key) VALUES ($1)", [key]);
    await query("DELETE FROM login_attempts WHERE at < now() - interval '1 day'");
  } catch {
    // counting is best-effort
  }
}
