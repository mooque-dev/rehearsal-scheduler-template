import { NextRequest, NextResponse } from "next/server";
import { adminEnabled, checkAdminPassword, changeAdminPassword, verifyAdminToken, ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE } from "@/lib/adminAuth";
import { callerKey, isBlocked, recordFailure } from "@/lib/throttle";

export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!(await adminEnabled())) {
    return NextResponse.json({ error: "admin_disabled" }, { status: 503 });
  }
  const key = callerKey(req, "admin");
  if (await isBlocked(key)) return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  const token = await checkAdminPassword(body.password);
  if (!token) {
    await recordFailure(key);
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }
  return signedIn(req, token);
}

function signedIn(req: NextRequest, token: string) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    // Secure whenever the page is served over https (Safari rejects Secure cookies on http://localhost)
    secure: (req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")) === "https",
    sameSite: "lax",
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}

/** Change the admin password: signed in, plus the current password again. */
export async function PUT(req: NextRequest) {
  if (!(await verifyAdminToken(req.cookies.get(ADMIN_COOKIE)?.value))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let body: { current?: string; next?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const key = callerKey(req, "admin");
  if (await isBlocked(key)) return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  const result = await changeAdminPassword(body.current, body.next);
  if ("error" in result) {
    if (result.error === "wrong_password") await recordFailure(key);
    const status = result.error === "wrong_password" ? 401 : result.error === "demo" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }
  return signedIn(req, result.token);
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
