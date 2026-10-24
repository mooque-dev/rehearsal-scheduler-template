"use client";

// Shared UI primitives. Every modal, icon button, segmented choice and status
// message in the app goes through these, so behaviour (Escape to close, focus,
// scroll lock, safe-area padding, tap targets, motion) is defined once instead
// of being hand-copied — and drifting — across a dozen class strings.

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { SITE } from "@/lib/site.config";
import { useBrand } from "@/components/BrandProvider";
import { LOGO_PATHS } from "@/lib/logoPaths";
import type { Lang } from "@/lib/i18n";

/* ── Icons ─────────────────────────────────────────────────────────────────
   One stroke style (24px grid, 2px stroke, round joins) so nothing reads as
   borrowed from a different set — this replaces the emoji that used to sit
   next to SVGs (🌙 ☀️ 📌 👤 ↩). */

const PATHS: Record<string, ReactNode> = {
  bell: (
    <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-4-5.7V5a2 2 0 1 0-4 0v.3A6 6 0 0 0 6 11v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" />
  ),
  link: (
    <path d="M13.8 10.2a4 4 0 0 0-5.6 0l-4 4a4 4 0 1 0 5.6 5.6l1.1-1.1m-.7-4.9a4 4 0 0 0 5.6 0l4-4a4 4 0 0 0-5.6-5.6l-1.1 1.1" />
  ),
  gear: (
    <>
      <path d="M10.3 3.9c.1-.5.6-.9 1.1-.9h1.1c.6 0 1 .4 1.1.9l.2.9c.1.4.4.8.8.9.4.2.9.1 1.2-.1l.7-.5c.5-.3 1.1-.3 1.5.1l.8.8c.4.4.4 1 .1 1.5l-.5.7c-.3.4-.3.8-.1 1.2.2.4.5.7.9.8l.9.2c.5.1.9.6.9 1.1v1.1c0 .6-.4 1-.9 1.1l-.9.2c-.4.1-.8.4-.9.8-.2.4-.1.9.1 1.2l.5.7c.3.5.3 1.1-.1 1.5l-.8.8c-.4.4-1 .4-1.5.1l-.7-.5c-.4-.3-.8-.3-1.2-.1-.4.2-.7.5-.8.9l-.2.9c-.1.5-.6.9-1.1.9h-1.1c-.6 0-1-.4-1.1-.9l-.2-.9c-.1-.4-.4-.8-.8-.9-.4-.2-.9-.1-1.2.1l-.7.5c-.5.3-1.1.3-1.5-.1l-.8-.8c-.4-.4-.4-1-.1-1.5l.5-.7c.3-.4.3-.8.1-1.2-.2-.4-.5-.7-.9-.8l-.9-.2c-.5-.1-.9-.6-.9-1.1v-1.1c0-.6.4-1 .9-1.1l.9-.2c.4-.1.8-.4.9-.8.2-.4.1-.9-.1-1.2l-.5-.7c-.3-.5-.3-1.1.1-1.5l.8-.8c.4-.4 1-.4 1.5-.1l.7.5c.4.3.8.3 1.2.1.4-.2.7-.5.8-.9l.2-.9z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  close: <path d="M6 18 18 6M6 6l12 12" />,
  calendar: <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  external: <path d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" />,
  pin: <path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </>
  ),
  moon: <path d="M20.4 14.5A8.5 8.5 0 0 1 9.5 3.6 8.5 8.5 0 1 0 20.4 14.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  undo: <path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4.5m0 3h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  archive: <path d="M4 7h16M5 7v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7M3 4h18v3H3zM10 11h4" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  sparkle: <path d="M12 3l1.9 4.6 4.6 1.9-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "w-4 h-4" }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

/* ── IconButton ────────────────────────────────────────────────────────────
   44px square on touch screens (Apple HIG / WCAG 2.5.5 minimum), 36px on
   desktop where a mouse doesn't need the room. */

export function IconButton({
  label,
  icon,
  onClick,
  badge,
  children,
  className = "",
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
  badge?: number;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={badge ? `${label} (${badge})` : label}
      title={label}
      className={`press relative inline-flex items-center justify-center gap-1.5 min-w-11 h-11 sm:min-w-9 sm:h-9 px-2.5 sm:px-2 rounded-xl sm:rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-100 active:bg-zinc-600 ${className}`}
    >
      <Icon name={icon} className="w-[1.125rem] h-[1.125rem] sm:w-4 sm:h-4" />
      {children}
      {!!badge && (
        <span className="tabular absolute -top-1.5 -right-1.5 min-w-[1.125rem] h-[1.125rem] px-1 bg-amber-500 text-zinc-950 text-[0.6875rem] font-bold rounded-full flex items-center justify-center ring-2 ring-zinc-950">
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── Sheet ─────────────────────────────────────────────────────────────────
   Bottom sheet on phones, centred dialog from 640px up. Handles the things
   every one of the old modals did differently or not at all: Escape, backdrop
   tap, scroll lock, initial focus, focus restore, dialog semantics, and
   bottom padding that clears the home indicator (a bare env() padding
   REPLACED the bottom padding, so on most phones it collapsed to 0px). */

let openSheets = 0;

export function Sheet({
  open,
  onClose,
  title,
  icon,
  children,
  footer,
  dismissable = true,
  centered = false,
  width = "sm",
  z = "z-[90]",
  closeLabel = "Close",
}: {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  icon?: IconName;
  children: ReactNode;
  footer?: ReactNode;
  dismissable?: boolean;
  centered?: boolean;
  width?: "sm" | "md";
  z?: string;
  closeLabel?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const canClose = dismissable && !!onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    openSheets++;
    document.documentElement.style.overflow = "hidden";
    // focus the panel itself (not the first field) so a phone keyboard
    // doesn't jump up the moment a sheet opens
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      openSheets--;
      if (openSheets === 0) document.documentElement.style.overflow = "";
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open || !canClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose!();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, canClose, onClose]);

  if (!open) return null;

  const placement = centered ? "items-center px-4" : "items-end sm:items-center sm:px-4";
  const shape = centered ? "rounded-2xl" : "rounded-t-2xl sm:rounded-2xl";
  const maxW = width === "md" ? "sm:max-w-md" : "sm:max-w-sm";

  return (
    <div
      className={`anim-fade fixed inset-0 ${z} flex justify-center bg-black/60 backdrop-blur-sm ${placement}`}
      onClick={(e) => canClose && e.target === e.currentTarget && onClose!()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`${centered ? "anim-pop max-w-sm" : `anim-sheet ${maxW}`} w-full max-h-[88dvh] flex flex-col bg-zinc-900 border border-zinc-700 shadow-2xl no-focus-ring ${shape}`}
      >
        {!centered && (
          <div className="sm:hidden flex justify-center pt-2 -mb-1" aria-hidden="true">
            <span className="w-9 h-1 rounded-full bg-zinc-700" />
          </div>
        )}
        {title && (
          <div className="flex items-center justify-between gap-3 px-5 pt-4 sm:pt-5 pb-3">
            <h2 id={titleId} className="flex items-center gap-2 text-lg font-semibold text-zinc-100 leading-snug">
              {icon && <Icon name={icon} className="w-5 h-5 text-zinc-400" />}
              {title}
            </h2>
            {canClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="press -mr-2 inline-flex items-center justify-center w-10 h-10 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className={`overflow-y-auto overscroll-contain flex-1 px-5 ${title ? "pb-4" : "py-6"} ${footer ? "" : "pb-[max(1.25rem,env(safe-area-inset-bottom))]"}`}>
          {children}
        </div>
        {footer && (
          <div className="px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-zinc-800">{footer}</div>
        )}
      </div>
    </div>
  );
}

/* ── Buttons ───────────────────────────────────────────────────────────────
   Three roles, used consistently: primary (the one thing to do), secondary
   (back out / close), and the selectable options inside Segmented. */

export function Button({
  children,
  onClick,
  variant = "secondary",
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "warning";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const styles = {
    primary: "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-600/20 font-semibold",
    secondary: "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 active:bg-zinc-600 font-medium",
    warning: "bg-amber-600 text-white hover:bg-amber-500 active:bg-amber-700 font-semibold",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`press min-h-11 px-4 rounded-xl text-sm disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
      {children}
    </label>
  );
}

export const inputClass =
  "w-full min-h-12 bg-zinc-800 border border-zinc-600 rounded-xl px-3.5 text-base text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: IconName;
  sub?: ReactNode;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  columns,
  label,
}: {
  options: SegmentedOption<T>[];
  value: T | "";
  onChange: (v: T) => void;
  columns?: 2 | 3;
  label?: string;
}) {
  const cols = columns ?? (options.length === 3 ? 3 : 2);
  return (
    <div role="group" aria-label={label} className={`grid gap-2 ${cols === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`press min-h-11 px-2 py-2 rounded-xl text-sm font-medium flex flex-col items-center justify-center gap-0.5 border ${
              on
                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20"
                : "bg-zinc-800 text-zinc-300 border-zinc-700/60 hover:bg-zinc-700 hover:text-zinc-100"
            }`}
          >
            <span className="flex items-center gap-1.5">
              {o.icon && <Icon name={o.icon} className="w-4 h-4" />}
              {o.label}
            </span>
            {o.sub && <span className={`text-[0.6875rem] ${on ? "text-blue-100" : "text-zinc-400"}`}>{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Toast ─────────────────────────────────────────────────────────────────
   Replaces window.alert(): non-blocking and announced to screen readers.
   Top of the screen, because the bottom belongs to the save bar and sheets —
   a bottom toast landed on top of the very buttons it was reporting on. */

export type ToastTone = "success" | "error";

export function useToast() {
  const [toast, setToast] = useState<{ id: number; message: string; tone: ToastTone } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, tone: ToastTone = "success") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = setTimeout(() => setToast(null), tone === "error" ? 4500 : 2400);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const node = (
    <div aria-live="polite" role="status" className="pointer-events-none">
      {toast && (
        <div
          key={toast.id}
          className={`anim-toast fixed left-1/2 -translate-x-1/2 z-[120] top-[max(0.75rem,env(safe-area-inset-top))] w-max flex items-center gap-2 max-w-[calc(100vw-2rem)] px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium ${
            toast.tone === "error"
              ? "bg-zinc-900 border-red-400/40 text-red-400"
              : "bg-zinc-900 border-emerald-500/40 text-zinc-100"
          }`}
        >
          <Icon name={toast.tone === "error" ? "alert" : "check"} className={`w-4 h-4 shrink-0 ${toast.tone === "error" ? "" : "text-emerald-500"}`} />
          {toast.message}
        </div>
      )}
    </div>
  );

  return { toast: node, show };
}

/* ── Whole-screen states ─────────────────────────────────────────────────── */

// The production mark, drawn in the current text colour so it follows the theme
// (white on dark, near-black on light). Size it with a width class.
export function Logo({ className = "w-11" }: { className?: string }) {
  const brand = useBrand();
  if (brand.logoVersion) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/brand/logo?v=${brand.logoVersion}`}
        alt={SITE.title.en}
        className={`${className} h-auto shrink-0 select-none object-contain`}
        draggable={false}
      />
    );
  }
  return (
    <svg
      viewBox="0 0 217 141"
      role="img"
      aria-label={SITE.title.en}
      className={`${className} h-auto shrink-0 text-zinc-100 select-none`}
      fill="currentColor"
    >
      {LOGO_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export function LoadingScreen({ lang }: { lang: Lang }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-950 text-zinc-400" role="status" aria-live="polite">
      <div className="anim-fade text-center">
        <Logo className="w-20 mx-auto mb-4 animate-pulse" />
        <span className="text-sm">{lang === "ko" ? "불러오는 중…" : "Loading…"}</span>
      </div>
    </div>
  );
}

export function ErrorScreen({ lang, onRetry }: { lang: Lang; onRetry: () => void }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-950 px-6">
      <div className="anim-pop text-center max-w-xs">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400">
          <Icon name="alert" className="w-6 h-6" />
        </div>
        <p className="text-sm text-zinc-300 mb-5 leading-relaxed">
          {lang === "ko"
            ? "일정을 불러오지 못했습니다. 인터넷 연결을 확인해 주세요."
            : "Couldn't load the schedule. Check your connection and try again."}
        </p>
        <Button variant="primary" onClick={onRetry} className="w-full">
          {lang === "ko" ? "다시 시도" : "Try again"}
        </Button>
      </div>
    </div>
  );
}
