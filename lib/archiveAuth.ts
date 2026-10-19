import { createHash, timingSafeEqual } from "crypto";

export const ARCHIVE_COOKIE = "sched_archive_auth";
export const ARCHIVE_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function expectedToken(): string | null {
  const pin = process.env.ARCHIVE_PIN;
  if (!pin) return null;
  return createHash("sha256").update(pin).digest("hex");
}

export function verifyPin(pin: string): string | null {
  const expected = expectedToken();
  if (!expected) return null;
  const given = createHash("sha256").update(pin).digest("hex");
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return expected;
}

export function verifyToken(token: string | undefined): boolean {
  const expected = expectedToken();
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
