import { NextRequest, NextResponse } from "next/server";
import { verifyPin, ARCHIVE_COOKIE, ARCHIVE_COOKIE_MAX_AGE } from "@/lib/archiveAuth";
import { callerKey, isBlocked, recordFailure } from "@/lib/throttle";

export async function POST(req: NextRequest) {
  let body: { pin?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.pin) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const key = callerKey(req, "archive");
  if (await isBlocked(key)) return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  const token = verifyPin(body.pin);
  if (!token) {
    await recordFailure(key);
    return NextResponse.json({ error: "wrong_pin" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ARCHIVE_COOKIE, token, {
    httpOnly: true,
    // Secure whenever the page is served over https (Safari rejects Secure cookies on http://localhost)
    secure: (req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")) === "https",
    sameSite: "lax",
    maxAge: ARCHIVE_COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
