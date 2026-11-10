import { ImageResponse } from "next/og";
import { query, ensureSchema } from "@/lib/db";
import { getBrandSafe } from "@/lib/data";
import { TONES, isHex, DEFAULT_BRAND } from "@/lib/brand";
import { LOGO_PATHS } from "@/lib/logoPaths";

// The picture chat apps show when the link is shared: the group's logo (or the
// placeholder mark) on its own background tone, with a band of its accent
// colour. No text, so no fonts are needed and Korean names can't render wrong.
export const dynamic = "force-dynamic";
export const alt = "Rehearsal schedule";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function logoDataUrl(): Promise<string | null> {
  try {
    await ensureSchema();
    const rows = await query<{ mime: string; data: Buffer }>("SELECT mime, data FROM assets WHERE key = 'logo'");
    return rows[0] ? `data:${rows[0].mime};base64,${Buffer.from(rows[0].data).toString("base64")}` : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const brand = await getBrandSafe();
  const scale = (TONES[brand.tone] ?? TONES.neutral)[brand.theme];
  const accent = isHex(brand.accent) ? brand.accent : DEFAULT_BRAND.accent;
  const logo = brand.logoVersion ? await logoDataUrl() : null;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: scale[0] }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" height={360} style={{ objectFit: "contain", maxWidth: 900 }} />
          ) : (
            <svg width="520" height="338" viewBox="0 0 217 141">
              {LOGO_PATHS.map((d, i) => (
                <path key={i} d={d} fill={scale[9]} />
              ))}
            </svg>
          )}
        </div>
        <div style={{ height: 28, background: accent, display: "flex" }} />
      </div>
    ),
    size
  );
}
