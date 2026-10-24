import { NextResponse } from "next/server";
import { query, ensureSchema } from "@/lib/db";

// The company logo uploaded on /admin (always a PNG, resized in the browser).
// URLs carry ?v=<version>, so a response can be cached for good.
export async function GET() {
  try {
    await ensureSchema();
    const rows = await query<{ mime: string; data: Buffer }>("SELECT mime, data FROM assets WHERE key = 'logo'");
    if (!rows[0]) return new NextResponse(null, { status: 404 });
    return new NextResponse(new Uint8Array(rows[0].data), {
      headers: {
        "Content-Type": rows[0].mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
