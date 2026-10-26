import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getCurrentSeason, withTransaction } from "@/lib/db";
import { isDemo } from "@/lib/adminAuth";
import { seedSample } from "@/lib/seed";

// Nightly reset of a public demo (scheduled in vercel.json). Vercel calls it with
// "Authorization: Bearer $CRON_SECRET"; it does nothing unless DEMO_MODE=1.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isDemo()) return NextResponse.json({ skipped: "not a demo" });
  await ensureSchema();
  const season = await getCurrentSeason();
  await withTransaction(async (q) => {
    await seedSample(q, season);
    await q("DELETE FROM assets WHERE key = 'logo'");
    await q("DELETE FROM _meta WHERE key = 'brand'");
  });
  return NextResponse.json({ ok: true, reset: new Date().toISOString() });
}
