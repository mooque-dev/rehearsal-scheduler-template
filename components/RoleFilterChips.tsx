"use client";

import { t, ROLE_FILTERS, type Lang } from "@/lib/i18n";

export default function RoleFilterChips({
  active,
  onChange,
  lang,
}: {
  active: string;
  onChange: (v: string) => void;
  lang: Lang;
}) {
  const l = (k: Parameters<typeof t>[1]) => t(lang, k);
  return (
    <div role="group" className="flex items-center gap-1.5 flex-nowrap min-w-max">
      {ROLE_FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          aria-pressed={active === filter}
          onClick={() => onChange(filter)}
          // 36px tall: comfortably tappable without turning a filter row into a
          // second toolbar
          className={`press min-h-9 px-3.5 rounded-full text-[0.8125rem] font-medium whitespace-nowrap border ${active === filter ? "bg-blue-600 text-white border-blue-500" : "bg-zinc-800 text-zinc-300 border-zinc-700/60 hover:bg-zinc-700 hover:text-zinc-100 active:bg-zinc-600"}`}
        >
          {filter === "All" ? l("all") : l(filter as Parameters<typeof t>[1])}
        </button>
      ))}
    </div>
  );
}
