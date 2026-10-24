// White-label branding: presets, tones, fonts, and the guardrails that keep any
// brand readable. Pure functions — used by the server (to write the brand CSS),
// the admin Branding tab (live preview + readability check) and the app.
//
// How it works: the app's components are styled with Tailwind colour tokens
// (zinc for neutrals, blue for the accent). A brand redefines those tokens, so
// every screen restyles without touching a component. The company chooses an
// accent freely; everything that has to be readable (text on the accent, accent
// used as text, tints behind text) is derived from it and adjusted until it
// passes WCAG AA. Status colours (✓ ✕, special, ★) never follow the brand, so a
// colour always means one thing.

export type Tone = "neutral" | "paper" | "sage" | "black";
export type FontKey = "geist" | "inter" | "plex" | "grotesk" | "nunito" | "newsreader" | "fraunces";
export type Corners = "sharp" | "soft" | "round";
export type HeaderLayout = "classic" | "centered";
export type Mode = "dark" | "light";

export interface Brand {
  preset: string;
  accent: string;
  tone: Tone;
  theme: Mode;
  headingFont: FontKey;
  bodyFont: FontKey;
  corners: Corners;
  header: HeaderLayout;
  /** bumped on every logo upload (cache-busts /api/brand/logo); null = no logo */
  logoVersion: number | null;
}

export const DEFAULT_BRAND: Brand = {
  preset: "stage",
  accent: "#2563eb",
  tone: "neutral",
  theme: "dark",
  headingFont: "geist",
  bodyFont: "geist",
  corners: "soft",
  header: "classic",
  logoVersion: null,
};

export const PRESETS: { key: string; name: { en: string; ko: string }; brand: Omit<Brand, "logoVersion"> }[] = [
  { key: "stage", name: { en: "Stage", ko: "스테이지" }, brand: { ...DEFAULT_BRAND, preset: "stage" } },
  {
    key: "paper",
    name: { en: "Paper", ko: "페이퍼" },
    brand: { preset: "paper", accent: "#1e3a5f", tone: "paper", theme: "light", headingFont: "newsreader", bodyFont: "plex", corners: "sharp", header: "centered" },
  },
  {
    key: "neon",
    name: { en: "Neon", ko: "네온" },
    brand: { preset: "neon", accent: "#c8ff3e", tone: "black", theme: "dark", headingFont: "grotesk", bodyFont: "grotesk", corners: "sharp", header: "classic" },
  },
  {
    key: "garden",
    name: { en: "Garden", ko: "가든" },
    brand: { preset: "garden", accent: "#2e6a3e", tone: "sage", theme: "light", headingFont: "nunito", bodyFont: "nunito", corners: "round", header: "classic" },
  },
];

/** Each font pairs a Latin face with a Korean one, so both languages look right. */
export const FONTS: Record<FontKey, { label: string; stack: string; google: string; serif?: boolean }> = {
  geist: { label: "Geist · Noto Sans KR", stack: "'Geist','Noto Sans KR',system-ui,sans-serif", google: "family=Geist:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700" },
  inter: { label: "Inter · Noto Sans KR", stack: "'Inter','Noto Sans KR',system-ui,sans-serif", google: "family=Inter:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700" },
  plex: { label: "IBM Plex Sans KR", stack: "'IBM Plex Sans KR',system-ui,sans-serif", google: "family=IBM+Plex+Sans+KR:wght@400;500;600;700" },
  grotesk: { label: "Space Grotesk · Noto Sans KR", stack: "'Space Grotesk','Noto Sans KR',system-ui,sans-serif", google: "family=Space+Grotesk:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;700" },
  nunito: { label: "Nunito · 고운돋움", stack: "'Nunito','Gowun Dodum',system-ui,sans-serif", google: "family=Nunito:wght@400;600;700;800&family=Gowun+Dodum" },
  newsreader: { label: "Newsreader · 나눔명조", stack: "'Newsreader','Nanum Myeongjo',Georgia,serif", google: "family=Newsreader:opsz,wght@6..72,500;6..72,600;6..72,700&family=Nanum+Myeongjo:wght@400;700", serif: true },
  fraunces: { label: "Fraunces · 고운바탕", stack: "'Fraunces','Gowun Batang',Georgia,serif", google: "family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Gowun+Batang:wght@400;700", serif: true },
};

/** Body text stays sans-serif (small serif text reads poorly on phones). */
export const BODY_FONTS: FontKey[] = ["geist", "inter", "plex", "grotesk", "nunito"];
export const HEADING_FONTS: FontKey[] = ["geist", "inter", "plex", "grotesk", "nunito", "newsreader", "fraunces"];

// Neutral scales, mapped onto the app's zinc tokens (950 = page … 100 = main text).
type Scale = [string, string, string, string, string, string, string, string, string, string];
const STEPS = [950, 900, 800, 700, 600, 500, 400, 300, 200, 100] as const;

export const TONES: Record<Tone, { name: { en: string; ko: string }; dark: Scale; light: Scale }> = {
  neutral: {
    name: { en: "Neutral", ko: "기본" },
    dark: ["#09090b", "#18181b", "#27272a", "#3f3f46", "#52525c", "#71717b", "#9f9fa9", "#d4d4d8", "#e4e4e7", "#f4f4f5"],
    light: ["#fafafa", "#ffffff", "#e4e4e7", "#d4d4d8", "#9f9fa9", "#71717b", "#52525c", "#3f3f46", "#27272a", "#18181b"],
  },
  paper: {
    name: { en: "Paper", ko: "종이" },
    dark: ["#14110d", "#1d1913", "#2a241b", "#3b3327", "#5a4f3f", "#7d715f", "#b3a893", "#d9cfbc", "#e9e1d1", "#f4efe4"],
    light: ["#f4efe4", "#fffcf5", "#ebe4d4", "#d6ccb6", "#a89c84", "#7a705e", "#574f42", "#3d362c", "#2a251e", "#1f1b15"],
  },
  sage: {
    name: { en: "Sage", ko: "세이지" },
    dark: ["#0c120d", "#131b14", "#1e2a20", "#2d3c2f", "#4a5d4c", "#6b7f6c", "#a5b8a5", "#cfdccc", "#e2ebdf", "#eef4ea"],
    light: ["#edf2e8", "#ffffff", "#e1e9da", "#cad8c0", "#98aa90", "#6b7d6c", "#46574a", "#33433a", "#24322a", "#1b281d"],
  },
  black: {
    name: { en: "Black", ko: "블랙" },
    // not pure black/white: very high contrast causes halation on phones at night
    dark: ["#0b0b0c", "#121214", "#1b1b1e", "#2e2e33", "#4a4a50", "#6e6e75", "#a8a8ad", "#cfcfd3", "#dcdcdf", "#e2e2e2"],
    light: ["#fafafa", "#ffffff", "#e4e4e7", "#d4d4d8", "#9f9fa9", "#71717b", "#52525c", "#3f3f46", "#27272a", "#18181b"],
  },
};

// ── colour maths ────────────────────────────────────────────────────────────

export function isHex(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
}

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex([r, g, b]: number[]): string {
  return "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
}

/** `amount` of `a` over `b` (0..1). */
export function mix(a: string, b: string, amount: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return toHex(x.map((v, i) => v * amount + y[i] * (1 - amount)));
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Push `color` toward white (dark pages) or black (light pages) until it reaches `target` on `bg`. */
export function ensureContrast(color: string, bg: string, target: number): string {
  if (contrast(color, bg) >= target) return color;
  const toward = luminance(bg) < 0.2 ? "#ffffff" : "#000000";
  for (let step = 0.05; step <= 1; step += 0.05) {
    const c = mix(toward, color, step);
    if (contrast(c, bg) >= target) return c;
  }
  return toward;
}

function hue(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return -1;
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

function saturation(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

// ── tokens + checks ─────────────────────────────────────────────────────────

export interface Check {
  key: string;
  label: { en: string; ko: string };
  ratio: number;
  target: number;
  /** the brand colour was adjusted to pass (shown as "Fixed") */
  fixedFrom?: number;
  sample: { bg: string; fg: string };
}

export interface Derived {
  vars: Record<string, string>;
  checks: Check[];
  /** colours that were changed to stay readable, for the editor to explain */
  notes: { en: string; ko: string }[];
}

const ON_DARK = "#0b0b0c";

export function deriveTokens(brand: Brand, mode: Mode): Derived {
  const scale = TONES[brand.tone]?.[mode] ?? TONES.neutral[mode];
  const [bg, surface, raised] = scale;
  const text = scale[9];
  const muted = scale[6];
  const accent = isHex(brand.accent) ? brand.accent : DEFAULT_BRAND.accent;
  const vars: Record<string, string> = { "--background": bg, "--foreground": text };
  STEPS.forEach((s, i) => (vars[`--color-zinc-${s}`] = scale[i]));

  // text on the accent: white or near-black, whichever reads better
  const onFill = contrast("#ffffff", accent) >= contrast(ON_DARK, accent) ? "#ffffff" : ON_DARK;
  // the accent used as text (tabs, "next", links) must reach 4.5:1 on the page and on cards
  const ink = ensureContrast(ensureContrast(accent, bg, 4.5), surface, 4.5);
  const wash = mode === "dark" ? mix(accent, bg, 0.28) : mix(accent, "#ffffff", 0.18);
  const washSoft = mode === "dark" ? mix(accent, bg, 0.16) : mix(accent, "#ffffff", 0.09);
  const inkOnWash = ensureContrast(ink, wash, 4.5);
  Object.assign(vars, {
    "--color-blue-600": accent,
    "--color-blue-500": mode === "dark" ? mix("#ffffff", accent, 0.12) : mix("#000000", accent, 0.08),
    "--color-blue-700": mix("#000000", accent, 0.15),
    "--color-blue-400": ink,
    "--color-blue-300": inkOnWash,
    "--color-blue-200": ensureContrast(mode === "dark" ? mix("#ffffff", ink, 0.4) : mix("#000000", ink, 0.3), wash, 4.5),
    "--color-blue-100": mode === "dark" ? mix("#ffffff", ink, 0.6) : mix("#000000", ink, 0.5),
    "--color-blue-900": wash,
    "--color-blue-950": washSoft,
    "--color-white": onFill,
  });

  const notes: Derived["notes"] = [];
  if (ink.toLowerCase() !== accent.toLowerCase()) {
    notes.push({
      en: `Your accent is too ${mode === "dark" ? "dark" : "light"} for text on a ${mode} page, so text uses ${ink.toUpperCase()} instead. Buttons keep your colour.`,
      ko: `선택한 색은 ${mode === "dark" ? "어두운" : "밝은"} 화면의 글자로 쓰기엔 너무 ${mode === "dark" ? "어두워서" : "밝아서"} 글자에는 ${ink.toUpperCase()}을 써요. 버튼은 선택한 색 그대로예요.`,
    });
  }
  const h = hue(accent);
  if (saturation(accent) > 0.35 && h >= 0 && (h < 18 || h > 340)) {
    notes.push({
      en: "This accent is close to the red used for ✕ (can't come). People may confuse selected items with absences.",
      ko: "이 색은 불참(✕)에 쓰는 빨간색과 비슷해서 헷갈릴 수 있어요.",
    });
  }

  const checks: Check[] = [
    { key: "text", label: { en: "Text on the page", ko: "화면의 글자" }, ratio: contrast(text, bg), target: 4.5, sample: { bg, fg: text } },
    { key: "muted", label: { en: "Grey text on cards", ko: "카드 위 회색 글자" }, ratio: contrast(muted, raised), target: 4.5, sample: { bg: raised, fg: muted } },
    { key: "button", label: { en: "Text on your colour", ko: "선택한 색 위 글자" }, ratio: contrast(onFill, accent), target: 4.5, sample: { bg: accent, fg: onFill } },
    {
      key: "ink",
      label: { en: "Your colour as text", ko: "글자로 쓴 선택한 색" },
      ratio: contrast(ink, bg),
      target: 4.5,
      fixedFrom: ink.toLowerCase() !== accent.toLowerCase() ? contrast(accent, bg) : undefined,
      sample: { bg, fg: ink },
    },
    { key: "wash", label: { en: "Text on highlighted dates", ko: "강조된 날짜 위 글자" }, ratio: contrast(inkOnWash, wash), target: 4.5, sample: { bg: wash, fg: inkOnWash } },
  ];
  return { vars, checks, notes };
}

const RADII: Record<Corners, Record<string, string> | null> = {
  soft: null,
  sharp: { "--radius-xs": "0px", "--radius-sm": "1px", "--radius-md": "2px", "--radius-lg": "2px", "--radius-xl": "3px", "--radius-2xl": "4px", "--radius-3xl": "6px" },
  round: { "--radius-sm": "0.375rem", "--radius-md": "0.5rem", "--radius-lg": "0.75rem", "--radius-xl": "1.125rem", "--radius-2xl": "1.5rem", "--radius-3xl": "2rem" },
};

const block = (vars: Record<string, string>) =>
  Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join("");

/** The stylesheet a branded page renders (both themes, fonts, corners). */
export function brandCss(brand: Brand): string {
  const dark = deriveTokens(brand, "dark").vars;
  const light = deriveTokens(brand, "light").vars;
  const radii = RADII[brand.corners] ?? null;
  const body = FONTS[brand.bodyFont] ?? FONTS.geist;
  const heading = FONTS[brand.headingFont] ?? FONTS.geist;
  return [
    `:root{${block(dark)}${radii ? block(radii) : ""}color-scheme:dark}`,
    `:root[data-theme="light"]{${block(light)}color-scheme:light}`,
    `body,button,input,select,textarea{font-family:${body.stack}}`,
    `h1,h2,h3,.brand-heading{font-family:${heading.stack}}`,
  ].join("\n");
}

export function brandFontsHref(brand: Brand): string {
  const parts = new Set([(FONTS[brand.bodyFont] ?? FONTS.geist).google, (FONTS[brand.headingFont] ?? FONTS.geist).google]);
  return `https://fonts.googleapis.com/css2?${[...parts].join("&")}&display=swap`;
}

/** Accepts anything (e.g. JSON from the database) and returns a valid brand. */
export function normalizeBrand(input: unknown): Brand {
  const b = (input && typeof input === "object" ? input : {}) as Partial<Brand>;
  const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);
  return {
    preset: typeof b.preset === "string" && b.preset.length <= 20 ? b.preset : "custom",
    accent: isHex(b.accent) ? b.accent.toLowerCase() : DEFAULT_BRAND.accent,
    tone: pick(b.tone, ["neutral", "paper", "sage", "black"] as const, DEFAULT_BRAND.tone),
    theme: pick(b.theme, ["dark", "light"] as const, DEFAULT_BRAND.theme),
    headingFont: pick(b.headingFont, HEADING_FONTS, DEFAULT_BRAND.headingFont),
    bodyFont: pick(b.bodyFont, BODY_FONTS, DEFAULT_BRAND.bodyFont),
    corners: pick(b.corners, ["sharp", "soft", "round"] as const, DEFAULT_BRAND.corners),
    header: pick(b.header, ["classic", "centered"] as const, DEFAULT_BRAND.header),
    logoVersion: typeof b.logoVersion === "number" && Number.isFinite(b.logoVersion) ? b.logoVersion : null,
  };
}
