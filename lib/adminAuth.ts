import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { query, ensureSchema, withTransaction } from "@/lib/db";

/**
 * The admin password opens /admin and also allows reverting Update Log entries.
 *
 * It starts as ADMIN_PASSWORD (set when the site is deployed). Once the admin changes it
 * on /admin, a scrypt hash is stored in _meta ("admin_password_hash") and the setup
 * password stops working. Deleting that row (`npm run reset-admin-password`) brings the
 * setup password back, which is how whoever hosts the site resets a forgotten one.
 *
 * REVERT_PASSWORD is still accepted for reverts, so older setups keep working.
 * Everything fails closed: no password anywhere, no access.
 */
const HASH_KEY = "admin_password_hash";
// set by scripts/set-admin-password.mjs when the host hands out a temporary password
const TEMP_KEY = "admin_password_temporary";
const ENV_KEY = "admin_password_env";
export const MIN_PASSWORD_LENGTH = 8;

type Secret = { kind: "stored"; hash: string } | { kind: "env"; password: string };

/** Which ADMIN_PASSWORD was set when the password was changed on /admin (a keyed hash, not the password). */
function envFingerprint(): string {
  return createHmac("sha256", "admin-env-fingerprint-v1").update(process.env.ADMIN_PASSWORD ?? "").digest("hex");
}

async function storedHash(): Promise<string | null> {
  try {
    await ensureSchema();
    const rows = await query<{ key: string; value: string | null }>(
      "SELECT key, value FROM _meta WHERE key IN ($1, $2)",
      [HASH_KEY, ENV_KEY]
    );
    const hash = rows.find((r) => r.key === HASH_KEY)?.value || null;
    const fp = rows.find((r) => r.key === ENV_KEY)?.value;
    // Changing ADMIN_PASSWORD in the hosting settings resets the password: a password
    // changed on /admin only counts while the setup password it replaced is still in place.
    if (hash && fp && fp !== envFingerprint()) return null;
    return hash;
  } catch {
    // no database yet: only the setup password can apply
    return null;
  }
}

async function adminSecret(): Promise<Secret | null> {
  const hash = await storedHash();
  if (hash) return { kind: "stored", hash };
  const pw = process.env.ADMIN_PASSWORD;
  return pw ? { kind: "env", password: pw } : null;
}

function same(a: string, b: string): boolean {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(pw, salt, 32);
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`;
}

function matchesHash(pw: string, stored: string): boolean {
  const [scheme, saltHex, keyHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const got = scryptSync(pw, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(got, expected);
}

function matches(given: string, secret: Secret): boolean {
  return secret.kind === "stored" ? matchesHash(given, secret.hash) : same(given, secret.password);
}

/**
 * True while the admin is on a temporary password someone else gave them: the setup password
 * on a hosted site (scripts/host-team.sh sets ADMIN_PASSWORD_IS_TEMPORARY=1), or one set by
 * scripts/set-admin-password.mjs. A group that deployed its own copy chose its own password,
 * so it is never nagged.
 */
export async function usingSetupPassword(): Promise<boolean> {
  if ((await storedHash()) === null) return process.env.ADMIN_PASSWORD_IS_TEMPORARY === "1";
  try {
    const rows = await query<{ value: string | null }>("SELECT value FROM _meta WHERE key = $1", [TEMP_KEY]);
    return rows[0]?.value === "1";
  } catch {
    return false;
  }
}

/** True when some admin password is set (stored or from setup). */
export async function adminEnabled(): Promise<boolean> {
  return (await adminSecret()) !== null;
}

export async function checkRevertPassword(given: string | undefined): Promise<"ok" | "wrong" | "disabled"> {
  const secret = await adminSecret();
  const legacy = process.env.REVERT_PASSWORD;
  if (!secret && !legacy) return "disabled";
  if (!given) return "wrong";
  if (legacy && same(given, legacy)) return "ok";
  return secret && matches(given, secret) ? "ok" : "wrong";
}

export const ADMIN_COOKIE = "sched_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

/** Session token: an HMAC keyed by the password (or its hash), so changing it signs everyone out. */
function tokenFor(secret: Secret): string {
  const key = secret.kind === "stored" ? secret.hash : secret.password;
  return createHmac("sha256", key).update("admin-session-v1").digest("hex");
}

export async function checkAdminPassword(given: string | undefined): Promise<string | null> {
  const secret = await adminSecret();
  if (!secret || !given || !matches(given, secret)) return null;
  return tokenFor(secret);
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  const secret = await adminSecret();
  if (!secret || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(tokenFor(secret));
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Replace the admin password. Returns the new session token, or an error code.
 * The caller must already be signed in; the current password is asked again anyway.
 */
export async function changeAdminPassword(
  current: string | undefined,
  next: string | undefined
): Promise<{ token: string } | { error: "wrong_password" | "too_short" | "demo" }> {
  if (isDemo()) return { error: "demo" };
  if (!(await checkAdminPassword(current))) return { error: "wrong_password" };
  if (!next || next.trim().length < MIN_PASSWORD_LENGTH) return { error: "too_short" };
  const hash = hashPassword(next);
  await withTransaction(async (q) => {
    await q(
      "INSERT INTO _meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [HASH_KEY, hash]
    );
    await q(
      "INSERT INTO _meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [ENV_KEY, envFingerprint()]
    );
    await q("DELETE FROM _meta WHERE key = $1", [TEMP_KEY]);
  });
  return { token: tokenFor({ kind: "stored", hash }) };
}

/** Demo deployments show the admin password on the sign-in screen and allow a reset. */
export function isDemo(): boolean {
  return process.env.DEMO_MODE === "1";
}

export function demoPasswordHint(): string | null {
  return isDemo() ? process.env.ADMIN_PASSWORD || null : null;
}
