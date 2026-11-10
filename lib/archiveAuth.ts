import { createHash, createHmac, timingSafeEqual } from "crypto";

export const ARCHIVE_COOKIE = "sched_archive_auth";
export const ARCHIVE_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function expectedToken(): string | null {
  const pin = process.env.ARCHIVE_PIN;
  if (!pin) return null;
  // a keyed MAC, not a bare hash of the passphrase: the cookie can't be used to
  // test guesses offline without also knowing the passphrase-derived key
  return createHmac("sha256", pin).update("archive-session-v1").digest("hex");
}

export function verifyPin(pin: string): string | null {
  const expected = expectedToken();
  if (!expected) return null;
  const real = process.env.ARCHIVE_PIN ?? "";
  const a = createHash("sha256").update(pin).digest();
  const b = createHash("sha256").update(real).digest();
  if (!timingSafeEqual(a, b)) return null;
  return expected;
}

export function verifyToken(token: string | undefined): boolean {
  const expected = expectedToken();
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
