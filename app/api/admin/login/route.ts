import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, ADMIN_COOKIE, ADMIN_COOKIE_MAX_AGE } from "@/lib/adminAuth";

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
  const token = checkAdminPassword(body.password);
  if (!token) return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
