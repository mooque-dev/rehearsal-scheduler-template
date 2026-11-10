"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { t, type Lang } from "@/lib/i18n";
import type { Person } from "@/lib/types";
import { attends, type SeasonDate } from "@/lib/season";
import { Button, Segmented, Sheet } from "@/components/ui";

function localISODate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function shortDate(date: string, lang: Lang): string {
  return new Date(date + "T12:00:00").toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
    month: "numeric",
    day: "numeric",
  });
}

type Sort = "absences" | "name";

/** Per-person absence counts and dates for the team on screen. Quiet by design:
 *  neutral tones, nothing is flagged. */
export default function AttendanceSummary({
  open,
  onClose,
  people,
  dates,
  statusMap,
  pendingChanges,
  defaultStatus,
  focusId,
  lang,
  usesRoles = false,
}: {
  open: boolean;
  onClose: () => void;
  people: Person[];
  dates: SeasonDate[];
  statusMap: Map<string, string>;
  pendingChanges: Map<string, string>;
  defaultStatus: "yes" | "unset";
  focusId: number | null;
  lang: Lang;
  usesRoles?: boolean;
}) {
  const l = (k: Parameters<typeof t>[1]) => t(lang, k);
  const ko = lang === "ko";
  const [sort, setSort] = useState<Sort>("name");
  const [view, setView] = useState<"people" | "dates">("people");
  const focusRef = useRef<HTMLLIElement>(null);

  const rows = useMemo(() => {
    const roleTeams = new Set(usesRoles ? people.map((p) => p.department) : []);
    const today = localISODate();
    const list = people.map((p) => {
      const absent: string[] = [];
      let unanswered = 0;
      for (const d of dates) {
        if (!attends(p, d, roleTeams)) continue;
        const k = `${p.id}:${d.date}`;
        const status = pendingChanges.has(k) ? pendingChanges.get(k) : (statusMap.get(k) ?? defaultStatus);
        if (status === "no") absent.push(d.date);
        else if (status === "unset" && d.date >= today) unanswered++;
      }
      return { p, absent, unanswered };
    });
    list.sort((a, b) =>
      sort === "name"
        ? a.p.name.localeCompare(b.p.name, ko ? "ko" : "en")
        : b.absent.length - a.absent.length || a.p.name.localeCompare(b.p.name, ko ? "ko" : "en")
    );
    return list;
  }, [people, dates, statusMap, pendingChanges, defaultStatus, sort, ko, usesRoles]);

  // The organiser's view: for each upcoming date, who is coming, who isn't and
  // who hasn't answered yet (the people to nudge).
  const byDate = useMemo(() => {
    const roleTeams = new Set(usesRoles ? people.map((p) => p.department) : []);
    const today = localISODate();
    return dates
      .filter((d) => d.date >= today)
      .map((d) => {
        let yes = 0;
        const no: string[] = [];
        const waiting: string[] = [];
        for (const p of people) {
          if (!attends(p, d, roleTeams)) continue;
          const k = `${p.id}:${d.date}`;
          const status = pendingChanges.has(k) ? pendingChanges.get(k) : (statusMap.get(k) ?? defaultStatus);
          if (status === "no") no.push(p.name);
          else if (status === "unset") waiting.push(p.name);
          else yes++;
        }
        return { d, yes, no, waiting };
      });
  }, [people, dates, statusMap, pendingChanges, defaultStatus, usesRoles]);

  useEffect(() => {
    if (open && focusId !== null) setView("people");
  }, [open, focusId]);

  useEffect(() => {
    if (open && focusId !== null) setTimeout(() => focusRef.current?.scrollIntoView({ block: "center" }), 50);
  }, [open, focusId]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={l("attendanceSummary")}
      icon="list"
      width="md"
      closeLabel={l("close")}
      footer={
        <Button className="w-full" onClick={onClose}>
          {l("close")}
        </Button>
      }
    >
      <div className="mb-3">
        <Segmented
          label={l("attendanceSummary")}
          value={view}
          onChange={setView}
          options={[
            { value: "people", label: ko ? "사람별" : "By person" },
            { value: "dates", label: ko ? "날짜별" : "By date" },
          ]}
        />
      </div>
      {view === "dates" ? (
        <ul className="divide-y divide-zinc-800">
          {byDate.length === 0 && <li className="py-8 text-center text-sm text-zinc-400">{ko ? "남은 일정이 없어요." : "No upcoming dates."}</li>}
          {byDate.map(({ d, yes, no, waiting }) => (
            <li key={d.date} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-zinc-100">
                  {new Date(d.date + "T12:00:00").toLocaleDateString(ko ? "ko-KR" : "en-US", { month: "short", day: "numeric", weekday: "short" })}
                  {d.title && <span className="ml-2 text-xs font-normal text-zinc-400">{d.title}</span>}
                </span>
                <span className="shrink-0 text-xs text-zinc-300 tabular">
                  {ko ? `참석 ${yes} · 불참 ${no.length}` : `${yes} coming · ${no.length} out`}
                  {defaultStatus === "unset" && <span className="text-zinc-400">{ko ? ` · 미응답 ${waiting.length}` : ` · ${waiting.length} to answer`}</span>}
                </span>
              </div>
              {no.length > 0 && (
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                  {ko ? "불참: " : "Out: "}
                  {no.join(", ")}
                </p>
              )}
              {defaultStatus === "unset" && waiting.length > 0 && (
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  {ko ? "미응답: " : "Not answered: "}
                  {waiting.join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
      <>
      <div className="mb-3">
        <Segmented
          label={ko ? "정렬" : "Sort"}
          value={sort}
          onChange={setSort}
          options={[
            { value: "name", label: l("sortName") },
            { value: "absences", label: l("sortAbsences") },
          ]}
        />
      </div>
      <ul className="divide-y divide-zinc-800">
        {rows.map(({ p, absent, unanswered }) => (
          <li
            key={p.id}
            ref={p.id === focusId ? focusRef : undefined}
            className={`py-2.5 ${p.id === focusId ? "bg-zinc-800/50 -mx-2 px-2 rounded-lg" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-zinc-100 min-w-0 truncate">{p.name}</span>
              <span className="shrink-0 text-xs text-zinc-400 tabular">
                {absent.length === 0 ? l("noAbsences") : ko ? `불참 ${absent.length}일` : `${absent.length} out`}
                {defaultStatus === "unset" && unanswered > 0 && (
                  <span className="text-zinc-500">
                    {" · "}
                    {ko ? `미응답 ${unanswered}` : `${unanswered} unanswered`}
                  </span>
                )}
              </span>
            </div>
            {absent.length > 0 && (
              <p className="mt-1 text-xs leading-relaxed text-zinc-500 tabular">
                {absent.map((d) => shortDate(d, lang)).join(" · ")}
              </p>
            )}
          </li>
        ))}
      </ul>
      </>
      )}
    </Sheet>
  );
}
