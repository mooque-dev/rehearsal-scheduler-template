import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * One admin password (ADMIN_PASSWORD) opens /admin and also allows reverting
 * Update Log entries. REVERT_PASSWORD is still accepted for reverts, so older
 * setups keep working. Everything fails closed: no password set, no access.
 */
function adminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null;
}

function same(a: string, b: string): boolean {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

export function checkRevertPassword(given: string | undefined): "ok" | "wrong" | "disabled" {
  const candidates = [process.env.REVERT_PASSWORD, adminPassword()].filter(Boolean) as string[];
  if (candidates.length === 0) return "disabled";
  if (!given) return "wrong";
  return candidates.some((c) => same(given, c)) ? "ok" : "wrong";
}

export const ADMIN_COOKIE = "sched_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

/** Session token: an HMAC keyed by the password, so changing the password signs everyone out. */
function adminToken(): string | null {
  const pw = adminPassword();
  return pw ? createHmac("sha256", pw).update("admin-session-v1").digest("hex") : null;
}

export function checkAdminPassword(given: string | undefined): string | null {
  const pw = adminPassword();
  if (!pw || !given || !same(given, pw)) return null;
  return adminToken();
}

export function verifyAdminToken(token: string | undefined): boolean {
  const expected = adminToken();
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Demo deployments show the admin password on the sign-in screen and allow a reset. */
export function isDemo(): boolean {
  return process.env.DEMO_MODE === "1";
}

export function demoPasswordHint(): string | null {
  return isDemo() ? adminPassword() : null;
}
