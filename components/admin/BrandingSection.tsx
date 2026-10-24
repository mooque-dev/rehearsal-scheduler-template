"use client";

// Admin → Branding: logo, colour, type, corners and header, with a live preview
// and a readability check that blocks publishing a brand people can't read.
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  BODY_FONTS,
  FONTS,
  HEADING_FONTS,
  PRESETS,
  TONES,
  deriveTokens,
  isHex,
  type Brand,
  type Corners,
  type FontKey,
  type HeaderLayout,
  type Mode,
  type Tone,
} from "@/lib/brand";
import type { AdminState } from "@/lib/adminTypes";
import { Button, FieldLabel, Icon, Logo, Segmented } from "@/components/ui";
import { DeleteButton, SelectField } from "@/components/admin/fields";

type Tx = (ko: string, en: string) => string;

const SWATCHES = ["#2563eb", "#1e3a5f", "#2e6a3e", "#c8ff3e", "#e11d48", "#f2c94c", "#7c3aed", "#ea580c"];
const ALL_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Geist:wght@400;700&family=Inter:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;700&family=Space+Grotesk:wght@400;700&family=Nunito:wght@400;800&family=Gowun+Dodum&family=Newsreader:opsz,wght@6..72,600&family=Nanum+Myeongjo:wght@700&family=Fraunces:opsz,wght@9..144,700&family=Gowun+Batang:wght@700&family=Noto+Sans+KR:wght@400;700&display=swap";

async function toPng(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const w0 = img.naturalWidth || 512;
    const h0 = img.naturalHeight || 512;
    for (const max of [512, 384, 256]) {
      const scale = Math.min(1, max / Math.max(w0, h0));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(w0 * scale));
      canvas.height = Math.max(1, Math.round(h0 * scale));
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL("image/png");
      if (data.length < 520_000) return data;
    }
    throw new Error("too_big");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Choice({ on, onClick, children, label }: { on: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
      className={`press flex flex-col items-center justify-center gap-1.5 min-h-16 p-2 rounded-xl bg-zinc-900 text-xs text-zinc-200 border ${
        on ? "border-blue-500 ring-1 ring-blue-500" : "border-zinc-700/70 hover:border-zinc-500"
      }`}
    >
      {children}
    </button>
  );
}

export default function BrandingSection({
  state,
  tx,
  lang,
  busy,
  act,
  onToast,
}: {
  state: AdminState;
  tx: Tx;
  lang: "ko" | "en";
  busy: boolean;
  act: (action: string, payload?: Record<string, unknown>, success?: string) => Promise<boolean>;
  onToast: (msg: string, tone?: "success" | "error") => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Brand>(state.brand);
  const [hexText, setHexText] = useState(state.brand.accent.toUpperCase());
  const [checkMode, setCheckMode] = useState<Mode>(state.brand.theme);
  const fileRef = useRef<HTMLInputElement>(null);
  const saved = state.brand;
  const dirty = JSON.stringify({ ...draft, logoVersion: null }) !== JSON.stringify({ ...saved, logoVersion: null });

  const set = (patch: Partial<Brand>) => setDraft((d) => ({ ...d, ...patch, preset: patch.preset ?? "custom" }));
  const derived = useMemo(() => ({ dark: deriveTokens(draft, "dark"), light: deriveTokens(draft, "light") }), [draft]);
  const failing = [...derived.dark.checks, ...derived.light.checks].filter((c) => c.ratio < c.target);
  const shown = derived[checkMode];

  async function upload(file: File) {
    try {
      const dataUrl = await toPng(file);
      if (await act("brand.logo", { dataUrl }, tx("로고를 올렸어요", "Logo uploaded"))) router.refresh();
    } catch {
      onToast(tx("이 이미지는 쓸 수 없어요. PNG, JPG 또는 SVG를 올려 주세요.", "That image can't be used. Try a PNG, JPG or SVG."), "error");
    }
  }

  const preview = derived[draft.theme];
  const previewStyle = {
    ...preview.vars,
    fontFamily: FONTS[draft.bodyFont].stack,
    colorScheme: draft.theme,
    ...(draft.corners === "sharp" ? { "--radius-xl": "3px", "--radius-lg": "2px", "--radius-md": "2px" } : {}),
    ...(draft.corners === "round" ? { "--radius-xl": "1.125rem", "--radius-lg": "0.75rem", "--radius-md": "0.5rem" } : {}),
  } as CSSProperties;

  const fontOptions = (keys: FontKey[]) => keys.map((k) => ({ value: k, label: FONTS[k].label }));

  return (
    <section className="space-y-7 pb-24">
      <link rel="stylesheet" href={ALL_FONTS_HREF} />

      <div className="space-y-2">
        <FieldLabel>{tx("시작할 스타일", "Start from a look")}</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => {
            const t = TONES[p.brand.tone][p.brand.theme];
            const on = draft.preset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setDraft({ ...p.brand, logoVersion: draft.logoVersion });
                  setHexText(p.brand.accent.toUpperCase());
                  setCheckMode(p.brand.theme);
                }}
                className={`press text-left p-2.5 rounded-xl bg-zinc-900 border ${on ? "border-blue-500 ring-1 ring-blue-500" : "border-zinc-700/70 hover:border-zinc-500"}`}
              >
                <span className="flex items-end gap-1.5 h-14 rounded-lg p-2" style={{ background: t[0], border: `1px solid ${t[3]}` }}>
                  <span className="flex-1 text-2xl font-bold leading-none" style={{ color: t[9], fontFamily: FONTS[p.brand.headingFont].stack }}>
                    Aa
                  </span>
                  <span className="w-4 h-4 rounded-full" style={{ background: p.brand.accent }} />
                </span>
                <span className="mt-2 flex items-center justify-between text-sm font-semibold text-zinc-100">
                  {p.name[lang]}
                  {on && <Icon name="check" className="w-4 h-4 text-blue-400" />}
                </span>
              </button>
            );
          })}
        </div>
        {draft.preset === "custom" && <p className="text-xs text-zinc-400">{tx("직접 바꾼 스타일이에요.", "Customised from a look.")}</p>}
      </div>

      <div className="space-y-2">
        <FieldLabel>{tx("로고", "Logo")}</FieldLabel>
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="w-16 h-16 shrink-0 grid place-items-center rounded-xl bg-zinc-800">
            <Logo className="w-12" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-xs text-zinc-400 leading-relaxed">
              {tx("PNG, JPG 또는 SVG. 정사각형이 가장 좋아요. 앱 아이콘으로도 쓰여요.", "PNG, JPG or SVG; square works best. Also used as the app icon.")}
            </p>
            <div className="flex gap-2">
              <Button onClick={() => fileRef.current?.click()} disabled={busy}>
                {saved.logoVersion ? tx("바꾸기", "Replace") : tx("올리기", "Upload")}
              </Button>
              {saved.logoVersion && (
                <DeleteButton
                  label={tx("삭제", "Remove")}
                  confirmLabel={tx("한 번 더", "Tap again")}
                  disabled={busy}
                  onConfirm={async () => {
                    if (await act("brand.logoRemove", {}, tx("로고를 지웠어요", "Logo removed"))) router.refresh();
                  }}
                />
              )}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) upload(f);
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <FieldLabel>{tx("대표 색", "Accent colour")}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              aria-pressed={draft.accent === c}
              onClick={() => {
                set({ accent: c });
                setHexText(c.toUpperCase());
              }}
              className={`w-10 h-10 rounded-full ${draft.accent === c ? "ring-2 ring-offset-2 ring-offset-zinc-950 ring-zinc-100" : "ring-1 ring-zinc-700"}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <label className="flex items-center gap-3 min-h-12 px-3 rounded-xl border border-zinc-600 bg-zinc-800">
          <input
            type="color"
            value={draft.accent}
            onChange={(e) => {
              set({ accent: e.target.value });
              setHexText(e.target.value.toUpperCase());
            }}
            aria-label={tx("색 고르기", "Pick a colour")}
            className="w-8 h-8 rounded-md bg-transparent border-0 p-0 cursor-pointer"
          />
          <span className="text-sm text-zinc-400">{tx("직접 입력", "Custom")}</span>
          <input
            value={hexText}
            onChange={(e) => {
              const v = e.target.value.trim();
              setHexText(v);
              const hex = v.startsWith("#") ? v : `#${v}`;
              if (isHex(hex)) set({ accent: hex.toLowerCase() });
            }}
            aria-label={tx("색 코드", "Colour code")}
            className="flex-1 min-w-0 bg-transparent font-mono text-base text-zinc-100 focus:outline-none"
          />
        </label>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden" aria-live="polite">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-zinc-800">
            <span className="text-sm font-semibold text-zinc-100">{tx("읽기 쉬운지 확인", "Readability check")}</span>
            <span className={`text-xs font-semibold ${failing.length ? "text-red-400" : "text-emerald-500"}`}>
              {failing.length ? tx("고쳐야 할 항목이 있어요", "Needs a fix") : tx("공개할 수 있어요", "Ready to publish")}
            </span>
          </div>
          <div className="px-3 pt-2.5">
            <Segmented
              label={tx("확인할 테마", "Theme to check")}
              value={checkMode}
              onChange={setCheckMode}
              options={[
                { value: "dark", label: tx("어두운 테마", "Dark") },
                { value: "light", label: tx("밝은 테마", "Light") },
              ]}
            />
          </div>
          <ul className="mt-2">
            {shown.checks.map((c) => {
              const ok = c.ratio >= c.target;
              return (
                <li key={c.key} className="flex items-center gap-3 px-3 py-2 border-t border-zinc-800/70">
                  <span className="w-10 h-7 shrink-0 grid place-items-center rounded-md text-xs font-bold" style={{ background: c.sample.bg, color: c.sample.fg }}>
                    Aa
                  </span>
                  <span className="flex-1 text-sm text-zinc-200">
                    {c.label[lang]}{" "}
                    <span className="tabular text-zinc-400">
                      {c.fixedFrom ? `${c.fixedFrom.toFixed(1)} → ` : ""}
                      {c.ratio.toFixed(1)}
                    </span>
                  </span>
                  <span className={`text-xs font-semibold ${!ok ? "text-red-400" : c.fixedFrom ? "text-amber-400" : "text-emerald-500"}`}>
                    {!ok ? tx("부족", "Too low") : c.fixedFrom ? tx("자동 조정", "Adjusted") : tx("통과", "Pass")}
                  </span>
                </li>
              );
            })}
          </ul>
          {[...shown.notes, ...(failing.some((c) => c.key === "button") ? [{ en: "Neither white nor black text reads well on this colour. Pick a darker or lighter shade.", ko: "이 색 위에서는 흰 글자도 검은 글자도 잘 안 보여요. 더 어둡거나 밝은 색을 골라 주세요." }] : [])].map((n, i) => (
            <p key={i} className="px-3 py-2.5 text-xs leading-relaxed text-amber-300 bg-amber-500/10 border-t border-zinc-800">
              {n[lang]}
            </p>
          ))}
          <p className="px-3 py-2.5 text-xs leading-relaxed text-zinc-400 border-t border-zinc-800">
            {tx(
              "기준: WCAG 2.2 AA (글자 대비 4.5:1 이상). 참석 ✓·불참 ✕·특별 일정 색은 브랜드와 상관없이 항상 같아요.",
              "Standard: WCAG 2.2 AA (text contrast at least 4.5:1). The ✓ / ✕ and special-session colours never change with the brand."
            )}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel>{tx("배경 톤", "Background tone")}</FieldLabel>
        <div className="grid grid-cols-4 gap-2">
          {(Object.keys(TONES) as Tone[]).map((k) => (
            <Choice key={k} on={draft.tone === k} onClick={() => set({ tone: k })}>
              <span className="w-8 h-4 rounded" style={{ background: TONES[k][draft.theme][0], border: `1px solid ${TONES[k][draft.theme][3]}` }} />
              {TONES[k].name[lang]}
            </Choice>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel>{tx("처음 열 때 테마", "Opens in")}</FieldLabel>
        <Segmented
          label={tx("기본 테마", "Default theme")}
          value={draft.theme}
          onChange={(v) => {
            set({ theme: v });
            setCheckMode(v);
          }}
          options={[
            { value: "dark", label: tx("어둡게", "Dark"), icon: "moon" },
            { value: "light", label: tx("밝게", "Light"), icon: "sun" },
          ]}
        />
        <p className="text-xs text-zinc-400">{tx("각자 설정에서 바꿀 수 있어요.", "Everyone can still switch in their own settings.")}</p>
      </div>

      <div className="space-y-4">
        <SelectField label={tx("제목 글꼴", "Heading font")} value={draft.headingFont} onChange={(v) => set({ headingFont: v })} options={fontOptions(HEADING_FONTS)} />
        <p className="-mt-2 text-xl font-bold text-zinc-100" style={{ fontFamily: FONTS[draft.headingFont].stack }}>
          Spring Musical · 봄 뮤지컬
        </p>
        <SelectField label={tx("본문 글꼴", "Body font")} value={draft.bodyFont} onChange={(v) => set({ bodyFont: v })} options={fontOptions(BODY_FONTS)} />
        <p className="-mt-2 text-base text-zinc-200" style={{ fontFamily: FONTS[draft.bodyFont].stack }}>
          Rehearsal, 4–7 PM · 정기 연습
        </p>
        <p className="text-xs text-zinc-400">{tx("본문은 읽기 쉬운 고딕 계열만 골라요. 글꼴마다 한글 글꼴이 짝지어져 있어요.", "Body text is always a sans-serif. Every font is paired with a Korean font.")}</p>
      </div>

      <div className="space-y-2">
        <FieldLabel>{tx("모서리", "Corners")}</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {(["sharp", "soft", "round"] as Corners[]).map((k) => (
            <Choice key={k} on={draft.corners === k} onClick={() => set({ corners: k })}>
              <span className="w-9 h-6 border-2 border-zinc-300" style={{ borderRadius: k === "sharp" ? 0 : k === "soft" ? 6 : 12 }} />
              {k === "sharp" ? tx("각지게", "Sharp") : k === "soft" ? tx("부드럽게", "Soft") : tx("둥글게", "Round")}
            </Choice>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel>{tx("상단 배치", "Header")}</FieldLabel>
        <div className="grid grid-cols-2 gap-2">
          {(["classic", "centered"] as HeaderLayout[]).map((k) => (
            <Choice key={k} on={draft.header === k} onClick={() => set({ header: k })}>
              <span className={`w-full h-10 rounded-md bg-zinc-800 flex flex-col gap-1 p-1.5 ${k === "centered" ? "items-center" : "items-start"}`}>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                  <span className="w-8 h-1.5 rounded bg-zinc-400" />
                </span>
                <span className="w-6 h-1 rounded bg-zinc-600" />
              </span>
              {k === "classic" ? tx("왼쪽 정렬", "Classic") : tx("가운데", "Centered")}
            </Choice>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel>{tx("미리보기", "Preview")}</FieldLabel>
        <div style={previewStyle} className="rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 p-4 space-y-3">
          <div className={`flex gap-2.5 ${draft.header === "centered" ? "flex-col items-center text-center" : "items-center"}`}>
            <Logo className={draft.header === "centered" ? "w-14" : "w-10"} />
            <div>
              <p className="text-lg font-bold leading-tight" style={{ fontFamily: FONTS[draft.headingFont].stack }}>
                {state.site.title[lang]}
              </p>
              <p className="text-sm text-zinc-400">
                {tx("다음 연습", "Next rehearsal")} · <span className="font-semibold text-blue-400">D-14</span>
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <span className="px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-sm font-semibold">{tx("전체", "All")}</span>
            <span className="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-sm">{tx("주/조연", "Leads")}</span>
            <span className="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-sm">{tx("앙상블", "Ensemble")}</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden text-sm">
            {[
              ["Avery Chen", "✓", "✕", "–"],
              ["Jordan Lee", "✓", "–", "✓"],
            ].map(([name, ...cells]) => (
              <div key={name} className="grid grid-cols-[1fr_repeat(3,3rem)] border-b border-zinc-800 last:border-b-0">
                <span className="px-3 py-2.5">{name}</span>
                {cells.map((c, i) => (
                  <span
                    key={i}
                    className={`grid place-items-center border-l border-zinc-800 font-bold ${
                      c === "✓" ? "text-emerald-500" : c === "✕" ? "text-red-400 bg-red-900/40" : "text-zinc-500"
                    } ${i === 0 ? "bg-blue-950/40" : ""}`}
                  >
                    {c}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <button type="button" className="w-full min-h-11 rounded-xl bg-blue-600 text-white font-semibold">
            {tx("저장", "Save")}
          </button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Button
            disabled={!dirty || busy}
            onClick={() => {
              setDraft(saved);
              setHexText(saved.accent.toUpperCase());
            }}
          >
            {tx("되돌리기", "Undo changes")}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={!dirty || busy || failing.length > 0}
            onClick={async () => {
              if (await act("brand.save", { brand: draft }, tx("브랜드를 공개했어요", "Brand published"))) router.refresh();
            }}
          >
            {failing.length > 0 ? tx("먼저 읽기 쉽게 고쳐 주세요", "Fix readability first") : tx("브랜드 공개", "Publish brand")}
          </Button>
        </div>
      </div>
    </section>
  );
}
