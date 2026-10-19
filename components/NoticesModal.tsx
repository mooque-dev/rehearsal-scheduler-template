"use client";

import { useState, type ReactNode } from "react";
import { t, type Lang } from "@/lib/i18n";
import type { Notice } from "@/lib/types";
import { Button, Icon, Sheet } from "@/components/ui";

export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T12:00:00");
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

// Supports plain "https://..." URLs and Markdown-style "[label](https://...)"
// links (for a clean label like "지도 보기" instead of a long raw URL).
function linkifyText(text: string): ReactNode[] {
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+)/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const [full, mdLabel, mdUrl, rawUrl] = match;
    const url = mdUrl ?? rawUrl;
    nodes.push(
      <a
        key={key++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 underline decoration-blue-400/40 underline-offset-2 hover:decoration-blue-400 break-all"
      >
        {mdLabel ?? rawUrl}
      </a>
    );
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function formatNoticeDate(dateStr: string, lang: Lang): string {
  try {
    const d = new Date(dateStr + "T12:00:00");
    const locale = lang === "ko" ? "ko-KR" : "en-US";
    const weekday = d.toLocaleDateString(locale, { weekday: "short" });
    const md = d.toLocaleDateString(locale, { month: "short", day: "numeric" });
    return `${md} (${weekday})`;
  } catch {
    return dateStr;
  }
}

export function NoticeCard({ n, lang }: { n: Notice; lang: Lang }) {
  const days = daysUntil(n.notice_date);
  const isPast = days < 0;
  const isSoon = !isPast && days <= 3;
  const d = new Date(n.notice_date + "T12:00:00");
  const locale = lang === "ko" ? "ko-KR" : "en-US";
  const soonLabel =
    days === 0
      ? lang === "ko" ? "오늘" : "Today"
      : days === 1
        ? lang === "ko" ? "내일" : "Tomorrow"
        : lang === "ko" ? `${days}일 후` : `In ${days} days`;
  return (
    <article
      className={`flex gap-3 rounded-xl p-3 border ${isPast ? "bg-zinc-800/20 border-zinc-800" : isSoon ? "bg-amber-900/20 border-amber-600/40" : "bg-zinc-800/40 border-zinc-700/50"}`}
    >
      <div
        className={`shrink-0 w-14 self-start rounded-lg py-1.5 text-center leading-none ${
          isPast ? "bg-zinc-800/60 text-zinc-500" : isSoon ? "bg-amber-500/15 text-amber-300" : "bg-zinc-800 text-zinc-200"
        }`}
      >
        <div className="text-[0.6875rem] font-semibold uppercase tracking-wide opacity-80">
          {d.toLocaleDateString(locale, { month: "short" })}
        </div>
        <div className="tabular text-xl font-bold mt-1">{d.getDate()}</div>
        <div className="text-[0.6875rem] mt-1 opacity-70">{d.toLocaleDateString(locale, { weekday: "short" })}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className={`text-sm font-semibold leading-snug ${isPast ? "text-zinc-400" : "text-zinc-100"}`}>{n.title}</h3>
          {isSoon && (
            <span className="shrink-0 text-[0.6875rem] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
              {soonLabel}
            </span>
          )}
        </div>
        {n.time_info && (
          <p className={`mt-1 text-xs flex items-center gap-1.5 ${isPast ? "text-zinc-500" : "text-zinc-300"}`}>
            <Icon name="clock" className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
            {n.time_info}
          </p>
        )}
        {n.content && (
          <p className={`text-sm mt-2 whitespace-pre-wrap leading-relaxed ${isPast ? "text-zinc-500" : "text-zinc-300"}`}>
            {linkifyText(n.content)}
          </p>
        )}
        {n.people_names && (
          <p className="text-xs text-zinc-400 mt-2 flex items-start gap-1.5">
            <Icon name="user" className="w-3.5 h-3.5 mt-px shrink-0 text-zinc-500" />
            <span>{n.people_names}</span>
          </p>
        )}
      </div>
    </article>
  );
}

export default function NoticesModal({
  notices,
  lang,
  open,
  onClose,
}: {
  notices: Notice[];
  lang: Lang;
  open: boolean;
  onClose: () => void;
}) {
  const l = (k: Parameters<typeof t>[1]) => t(lang, k);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const upcoming = notices
    .filter((n) => daysUntil(n.notice_date) >= 0)
    .sort((a, b) => a.notice_date.localeCompare(b.notice_date));
  const past = notices
    .filter((n) => daysUntil(n.notice_date) < 0)
    .sort((a, b) => b.notice_date.localeCompare(a.notice_date));
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={l("notices")}
      icon="pin"
      width="md"
      closeLabel={l("close")}
      footer={
        <Button className="w-full" onClick={onClose}>
          {l("close")}
        </Button>
      }
    >
      <div role="tablist" className="flex gap-1 border-b border-zinc-800 -mx-5 px-5 mb-3 sticky top-0 bg-zinc-900 z-10">
        {(["upcoming", "past"] as const).map((tabKey) => {
          const count = tabKey === "upcoming" ? upcoming.length : past.length;
          const on = tab === tabKey;
          return (
            <button
              key={tabKey}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(tabKey)}
              className={`relative min-h-11 px-3 text-sm font-medium transition-colors ${on ? "text-blue-400" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              {l(tabKey)}
              <span className={`tabular ml-1.5 text-xs ${on ? "text-blue-400/80" : "text-zinc-500"}`}>{count}</span>
              <span
                aria-hidden="true"
                className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-blue-500 transition-transform duration-200 ${on ? "scale-x-100" : "scale-x-0"}`}
              />
            </button>
          );
        })}
      </div>

      <div key={tab} className="anim-fade space-y-2">
        {list.length === 0 && <p className="text-sm text-zinc-400 text-center py-8">{l("noNotices")}</p>}
        {list.map((n) => (
          <NoticeCard key={n.id} n={n} lang={lang} />
        ))}
      </div>
    </Sheet>
  );
}
