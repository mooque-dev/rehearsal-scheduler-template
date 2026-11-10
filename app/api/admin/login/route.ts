import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE } from "@/lib/adminAuth";
import { callerKey, isBlocked, recordFailure } from "@/lib/throttle";

export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "admin_disabled" }, { status: 503 });
  }
  const key = callerKey(req, "admin");
  if (await isBlocked(key)) return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  const token = checkAdminPassword(body.password);
  if (!token) {
    await recordFailure(key);
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }
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

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
