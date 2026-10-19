"use client";

import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale/ko";
import { t, type Lang } from "@/lib/i18n";
import type { Notice } from "@/lib/types";
import type { SeasonDate } from "@/lib/season";
import { Button, Icon, Sheet } from "@/components/ui";
import { PLACES } from "@/lib/season";
import { mapsUrl } from "@/lib/resources";
import { NoticeCard, formatNoticeDate } from "@/components/NoticesModal";

function parseDay(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ScheduleCalendar({ notices, dates, breaks, lang }: { notices: Notice[]; dates: SeasonDate[]; breaks: { from: string; to: string }[]; lang: Lang }) {
  const l = (k: Parameters<typeof t>[1]) => t(lang, k);
  const byDay = useMemo(() => {
    const m = new Map<string, Notice[]>();
    for (const n of notices) m.set(n.notice_date, [...(m.get(n.notice_date) ?? []), n]);
    return m;
  }, [notices]);
  const marked = useMemo(() => [...byDay.keys()].map(parseDay), [byDay]);
  const rehearsals = useMemo(() => dates.filter((d) => !d.isPerformance && !d.coachVisit), [dates]);
  const rehearsalDays = useMemo(() => rehearsals.map((d) => parseDay(d.date)), [rehearsals]);
  const visitDays = useMemo(() => dates.filter((d) => d.coachVisit).map((d) => parseDay(d.date)), [dates]);
  const showDays = useMemo(() => dates.filter((d) => d.isPerformance).map((d) => parseDay(d.date)), [dates]);
  const dateByKey = useMemo(() => new Map(dates.map((d) => [d.date, d])), [dates]);
  const isBreak = (d: Date) => breaks.some((b) => dayKey(d) >= b.from && dayKey(d) <= b.to);
  const scheduled = useMemo(
    () => new Set([...dates.map((d) => d.date), ...byDay.keys()]),
    [dates, byDay]
  );

  // open on today, in today's month — a notice further out is one tap away
  const initial = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);
  const [selected, setSelected] = useState<Date | undefined>(initial);
  const [month, setMonth] = useState<Date>(initial ?? new Date());
  const dayNotices = selected ? (byDay.get(dayKey(selected)) ?? []) : [];
  const dayDate = selected ? dateByKey.get(dayKey(selected)) : undefined;

  return (
    <div className="anim-fade">
      <DayPicker
        mode="single"
        required
        selected={selected}
        onSelect={(d) => setSelected(d)}
        month={month}
        onMonthChange={setMonth}
        locale={lang === "ko" ? ko : undefined}
        weekStartsOn={0}
        showOutsideDays
        modifiers={{
          hasNotice: marked,
          rehearsal: rehearsalDays,
          coachVisit: visitDays,
          showDay: showDays,
          unscheduled: (d: Date) => !scheduled.has(dayKey(d)) && !isBreak(d),
          restDay: isBreak,
        }}
        modifiersClassNames={{
          hasNotice: "ys-has-notice",
          rehearsal: "ys-rehearsal",
          coachVisit: "ys-visit",
          showDay: "ys-show",
          unscheduled: "ys-unscheduled",
          restDay: "ys-break",
        }}
        classNames={{
          root: "w-full",
          months: "relative",
          month: "w-full",
          month_caption: "flex items-center h-11 px-1",
          caption_label: "text-base font-semibold text-zinc-100",
          nav: "absolute right-0 top-0 flex items-center gap-1",
          button_previous:
            "press w-11 h-11 inline-flex items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
          button_next:
            "press w-11 h-11 inline-flex items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
          chevron: "w-4 h-4 fill-current",
          month_grid: "w-full border-separate border-spacing-y-0.5",
          weekdays: "",
          weekday: "w-[14.28%] pb-1.5 text-xs font-medium text-zinc-400 text-center",
          week: "",
          day: "p-0 text-center",
          day_button:
            "press relative w-full min-h-11 inline-flex items-center justify-center rounded-xl text-sm tabular text-zinc-200 hover:bg-zinc-800",
          today: "[&>button]:font-bold [&>button]:text-blue-400 [&>button]:ring-1 [&>button]:ring-inset [&>button]:ring-blue-400/50",
          selected: "[&>button]:!bg-blue-600 [&>button]:!text-white [&>button]:font-semibold [&>button]:shadow-lg [&>button]:shadow-blue-600/20",
          outside: "opacity-35",
        }}
      />

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-md bg-blue-500/30 ring-1 ring-blue-400/50" />
          {l("legendRehearsal")}
        </span>
        {visitDays.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-violet-500/30 ring-1 ring-violet-400/50" />
            {l("coachVisit")}
          </span>
        )}
        {breaks.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md ring-1 ring-zinc-500 ys-break-swatch" />
            {l("legendBreak")}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {l("legendNotice")}
        </span>
      </div>

      <h3 className="mt-4 mb-2 text-sm font-semibold text-zinc-300 tabular flex items-center gap-2 flex-wrap">
        {selected ? formatNoticeDate(dayKey(selected), lang) : ""}
        {dayDate && !dayDate.isPerformance && (
          <span
            className={`text-[0.6875rem] px-1.5 py-0.5 rounded-full font-semibold ${
              dayDate.coachVisit ? "bg-violet-500/20 text-violet-300" : "bg-blue-500/20 text-blue-300"
            }`}
          >
            {dayDate.coachVisit ? `${l("coachVisit")} · ${l("castOnly")}` : l("rehearsalDay")}
          </span>
        )}
      </h3>
      {dayDate && (dayDate.time || dayDate.place) && (
        <p className="mb-2 text-sm text-zinc-300 flex items-start gap-1.5">
          <Icon name="clock" className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-500" />
          <span>
            {dayDate.time}
            {dayDate.time && dayDate.place ? " · " : ""}
            {dayDate.place && (
              <a
                href={mapsUrl(PLACES[dayDate.place].address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline decoration-blue-400/40 underline-offset-2 hover:decoration-blue-400"
              >
                {PLACES[dayDate.place][lang]}
              </a>
            )}
          </span>
        </p>
      )}
      {selected && !dayDate && isBreak(selected) && (
        <p className="mb-2 text-sm text-zinc-400">{l("breakDay")}</p>
      )}
      <div className="space-y-2">
        {dayNotices.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-6">{l("noNoticesOnDay")}</p>
        ) : (
          dayNotices.map((n) => <NoticeCard key={n.id} n={n} lang={lang} />)
        )}
      </div>
    </div>
  );
}

export default function CalendarModal({
  notices,
  dates,
  breaks = [],
  lang,
  open,
  onClose,
}: {
  notices: Notice[];
  dates: SeasonDate[];
  breaks?: { from: string; to: string }[];
  lang: Lang;
  open: boolean;
  onClose: () => void;
}) {
  const l = (k: Parameters<typeof t>[1]) => t(lang, k);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={l("calendar")}
      icon="calendar"
      width="md"
      closeLabel={l("close")}
      footer={
        <Button className="w-full" onClick={onClose}>
          {l("close")}
        </Button>
      }
    >
      {open && <ScheduleCalendar notices={notices} dates={dates} breaks={breaks} lang={lang} />}
    </Sheet>
  );
}
