import { NextRequest, NextResponse } from "next/server";
import { verifyPin, ARCHIVE_COOKIE, ARCHIVE_COOKIE_MAX_AGE } from "@/lib/archiveAuth";

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
  const token = verifyPin(body.pin);
  if (!token) {
    return NextResponse.json({ error: "wrong_pin" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ARCHIVE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ARCHIVE_COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
