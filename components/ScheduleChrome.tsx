"use client";

// Pieces shared by the live schedule (ScheduleApp) and the read-only archive of an
// earlier season (ArchiveApp). Team labels come from site.config.ts.

import type { ReactNode } from "react";
import { t, DEPARTMENTS, ROLE_DOT_COLOR, type DepartmentKey, type Lang } from "@/lib/i18n";

export function DeptTabs({
  value,
  onChange,
  labelFor,
  trailing,
}: {
  value: DepartmentKey;
  onChange: (d: DepartmentKey) => void;
  labelFor: (d: DepartmentKey) => string;
  /** sits at the right end of the tab row (e.g. the attendance summary button) */
  trailing?: ReactNode;
}) {
  return (
    <div className="mb-3 sm:mb-4 flex items-center border-b border-zinc-800 -mx-3 px-3 sm:mx-0 sm:px-0">
    <div role="tablist" className="flex gap-1 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]">
      {DEPARTMENTS.map((d) => {
        const on = d === value;
        return (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => !on && onChange(d)}
            className={`relative min-h-11 px-3.5 sm:px-4 text-sm font-medium whitespace-nowrap transition-colors ${
              on ? "text-blue-400" : "text-zinc-400 hover:text-zinc-200 active:text-zinc-100"
            }`}
          >
            {labelFor(d)}
            {/* always rendered, so selecting a tab grows the underline in
                rather than snapping it on */}
            <span
              aria-hidden="true"
              className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-blue-500 origin-center transition-transform duration-200 ease-out ${
                on ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </button>
        );
      })}
    </div>
    {trailing && <div className="shrink-0 pl-2 pb-px">{trailing}</div>}
    </div>
  );
}

export function StatusLegend({ lang, showRoles, showMaybe = false, showUnset = false, showAlso = false, onOpenSummary }: { lang: Lang; showRoles: boolean; showMaybe?: boolean; showUnset?: boolean; showAlso?: boolean; onOpenSummary?: () => void }) {
  const l = (k: Parameters<typeof t>[1]) => t(lang, k);
  return (
    <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400 capitalize">
      <span className="flex items-center gap-1.5">
        <span className="text-emerald-500 font-bold">✓</span> {l("yes")}
      </span>
      {showUnset && (
        <span className="flex items-center gap-1.5">
          <span className="text-zinc-400 font-bold">–</span> {l("legendUnset")}
        </span>
      )}
      {showMaybe && (
        <span className="flex items-center gap-1.5">
          <span className="text-amber-400 font-bold">?</span> {l("maybe")}
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <span className="text-red-400 font-bold">✕</span> {l("no")}
      </span>
      {onOpenSummary && (
        <button
          type="button"
          onClick={onOpenSummary}
          className="press inline-flex items-center min-h-8 px-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 normal-case font-medium"
        >
          {l("attendanceSummary")}
        </button>
      )}
      {showRoles && (
        <>
          <span className="w-px h-3 bg-zinc-700" aria-hidden="true" />
          {(["Main/Sub", "Ensemble", "Coach"] as const).map((r) => (
            <span key={r} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${ROLE_DOT_COLOR[r]}`} /> {l(r)}
            </span>
          ))}
          {showAlso && (
            <span className="flex items-center gap-1.5 normal-case">
              <span className="relative w-2 h-2 rounded-full bg-zinc-600">
                <span className="absolute -right-0.5 -bottom-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-zinc-950" />
              </span>
              {l("alsoLegend")}
            </span>
          )}
        </>
      )}
    </div>
  );
}
