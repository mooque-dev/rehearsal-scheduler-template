// Gives a site a new temporary admin password: for whoever hosts the site, when the
// admin has forgotten theirs. The old password stops working right away; no redeploy.
// The admin is asked to change it on /admin the next time they sign in.
//
//   npm run set-admin-password            make up a random one and print it
//   npm run set-admin-password -- "words" use this one instead
//
// Needs DATABASE_URL (in .env.local or the environment) for that site's database.
import { readFileSync, existsSync } from "node:fs";
import { randomBytes, randomInt, scryptSync } from "node:crypto";
import pg from "pg";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file) || process.env.DATABASE_URL) continue;
  const m = readFileSync(file, "utf8").match(/^DATABASE_URL=["']?([^"'\n]+)["']?/m);
  if (m) process.env.DATABASE_URL = m[1];
}
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error("DATABASE_URL is not set for the site whose password you are resetting.");
  process.exit(1);
}

// easy to read aloud or type on a phone: no 0/o, 1/l/i
function temporaryPassword() {
  const abc = "abcdefghjkmnpqrstuvwxyz23456789";
  const group = () => Array.from({ length: 4 }, () => abc[randomInt(abc.length)]).join("");
  return `${group()}-${group()}-${group()}`;
}

const given = process.argv[2];
if (given !== undefined && given.trim().length < 8) {
  console.error("Use at least 8 characters.");
  process.exit(1);
}
const password = given ?? temporaryPassword();

// same format as lib/adminAuth.ts
const salt = randomBytes(16);
const hash = `scrypt:${salt.toString("hex")}:${scryptSync(password, salt, 32).toString("hex")}`;

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("CREATE TABLE IF NOT EXISTS _meta (key TEXT PRIMARY KEY, value TEXT)");
  const upsert = "INSERT INTO _meta (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value";
  await client.query(upsert, ["admin_password_hash", hash]);
  await client.query(upsert, ["admin_password_temporary", "1"]);
  // forget which hosting password the old one replaced, so this one counts whatever it is
  await client.query("DELETE FROM _meta WHERE key = 'admin_password_env'");
  await client.query("COMMIT");
  await client.query("DELETE FROM login_attempts").catch(() => {}); // also lift any sign-in lockout
} catch (e) {
  await client.query("ROLLBACK").catch(() => {});
  throw e;
} finally {
  await client.end();
}
console.log(given ? "Admin password set." : `Temporary admin password: ${password}`);
