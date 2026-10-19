import { createHash, timingSafeEqual } from "crypto";

/**
 * Reverting rewrites history for everyone, so it needs the admin password
 * (REVERT_PASSWORD env var). Fails closed: with no password configured,
 * nobody can revert.
 */
export function checkRevertPassword(given: string | undefined): "ok" | "wrong" | "disabled" {
  const expected = process.env.REVERT_PASSWORD;
  if (!expected) return "disabled";
  if (!given) return "wrong";
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b) ? "ok" : "wrong";
}
