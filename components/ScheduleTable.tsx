"use client";

import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { storageKey } from "@/lib/site.config";
import { t, ROLE_ORDER, ROLE_DOT_COLOR, displayCharacterName, type Lang } from "@/lib/i18n";
import type { Person } from "@/lib/types";
import { attends, type SeasonDate } from "@/lib/season";
import RoleDot from "@/components/RoleDot";
import { Icon } from "@/components/ui";

const COLLAPSE_KEY = storageKey("CollapsedGroups");

function loadCollapsed(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? "[]");
    return new Set(Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

const STATUS_SYMBOL: Record<string, string> = { yes: "✓", maybe: "?", no: "✕", unset: "–" };
const STATUS_TEXT_CLASS: Record<string, string> = {
  yes: "text-emerald-500/70",
  maybe: "text-amber-400 font-bold",
  no: "text-red-400 font-bold",
  unset: "text-zinc-500",
};
const STATUS_BG_CLASS: Record<string, string> = { yes: "", unset: "", maybe: "bg-amber-900/30", no: "bg-red-900/40" };
const STATUS_HOVER_CLASS: Record<string, string> = {
  yes: "hover:bg-zinc-700/30 active:bg-zinc-700/60",
  maybe: "hover:bg-amber-900/50 active:bg-amber-900/70",
  no: "hover:bg-red-900/60 active:bg-red-900/80",
  unset: "hover:bg-zinc-700/30 active:bg-zinc-700/60",
};

function key(personId: number, date: string) {
  return `${personId}:${date}`;
}

/** Today as YYYY-MM-DD in the viewer's own timezone. The previous version used
 *  toISOString(), which is UTC — so from 8pm on a Toronto Sunday (EDT) "today"
 *  had already rolled over to Monday and the highlight jumped to next week. */
function localISODate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayIndex(dates: SeasonDate[]): number {
  const iso = localISODate();
  return dates.findIndex((d) => d.date >= iso);
}

function parts(date: string) {
  const d = new Date(date + "T12:00:00");
  return { month: d.getMonth(), day: d.getDate(), weekday: d.getDay(), year: d.getFullYear(), obj: d };
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

export default function ScheduleTable({
  people,
  dates,
  statusMap,
  pendingChanges,
  onToggle,
  onRoleChange,
  pendingRoles,
  lang,
  department,
  usesRoles = false,
  lastToggled,
  defaultStatus = "yes",
  onNameClick,
}: {
  people: Person[];
  dates: SeasonDate[];
  statusMap: Map<string, string>;
  pendingChanges: Map<string, string>;
  onToggle?: (personId: number, date: string) => void;
  onRoleChange?: (personId: number, role: string | null) => void;
  pendingRoles: Map<number, string | null>;
  lang: Lang;
  department: string;
  /** group this team by role (leads / ensemble / coaches) */
  usesRoles?: boolean;
  /** "personId:date#n" of the most recent tap, so only that cell animates */
  lastToggled?: string | null;
  /** what a cell with no saved answer means: "yes" (attending) or "unset" (not selected) */
  defaultStatus?: "yes" | "unset";
  /** tapping a name opens that person in the attendance summary */
  onNameClick?: (personId: number) => void;
}) {
  const readOnly = !onToggle;
  // groups the viewer folded away (a coach or ensemble member rarely wants to
  // scroll past the leads); remembered per browser
  const [collapsed, setCollapsed] = useState<Set<string>>(loadCollapsed);
  const toggleGroup = (role: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next]));
      } catch {
        // remembering is a convenience only
      }
      return next;
    });
  const isActors = usesRoles;
  const roleTeams = new Set(usesRoles ? [department] : []);
  const l = (k: Parameters<typeof t>[1]) => t(lang, k);
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const nameHeadRef = useRef<HTMLTableCellElement>(null);
  const todayColRef = useRef<HTMLTableCellElement>(null);
  const todayCol = todayIndex(dates);
  const locale = lang === "ko" ? "ko-KR" : "en-US";

  // Bring the next rehearsal into view on load, sitting right after the sticky
  // name column. The old centring maths ignored that column, so on a phone the
  // "today" column landed half-hidden underneath it.
  useLayoutEffect(() => {
    const container = scrollRef.current;
    const cell = todayColRef.current;
    if (!container || !cell) return;
    const sticky = nameHeadRef.current?.offsetWidth ?? 0;
    const offset = cell.getBoundingClientRect().left - container.getBoundingClientRect().left + container.scrollLeft;
    container.scrollLeft = Math.max(0, offset - sticky);
  }, [todayCol, people.length, isMobile]);

  const groups = isActors
    ? (() => {
        const buckets: { role: string; people: Person[] }[] = [
          { role: "Main/Sub", people: [] },
          { role: "Ensemble", people: [] },
          { role: "Coach", people: [] },
          { role: "Unassigned", people: [] },
        ];
        for (const p of people) {
          const effective = pendingRoles.has(p.id) ? (pendingRoles.get(p.id) ?? null) : p.role;
          const idx = effective && effective in ROLE_ORDER ? ROLE_ORDER[effective] : 3;
          buckets[idx].people.push(p);
        }
        return buckets.filter((b) => b.people.length > 0);
      })()
    : [{ role: "", people }];

  const nameColWidth = isMobile ? "7.75rem" : "11.25rem";
  // 44px date columns on phones: the minimum comfortable tap width, and it
  // leaves room for ~5.5 weeks beside a name column wide enough for 3–4 syllables
  const dateColWidth = isMobile ? "2.75rem" : "3.875rem";
  const statusWord = (s: string) => l(s as Parameters<typeof t>[1]);

  return (
    <div
      ref={scrollRef}
      tabIndex={0}
      aria-label={l("name")}
      className="no-focus-ring overflow-x-auto overscroll-x-contain border-y sm:border border-zinc-800 sm:rounded-xl -mx-3 sm:mx-0 bg-zinc-950"
    >
      <table
        className="border-separate border-spacing-0 min-w-max"
        style={{ tableLayout: "fixed", width: `calc(${nameColWidth} + ${dates.length} * ${dateColWidth})` }}
      >
        <colgroup>
          <col style={{ width: nameColWidth }} />
          {dates.map((d) => (
            <col key={d.date} style={{ width: dateColWidth }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th
              ref={nameHeadRef}
              scope="col"
              className="sticky left-0 top-0 z-20 bg-zinc-900 border-b border-r border-zinc-800 px-2.5 py-2 text-left align-bottom"
            >
              <span className="text-[0.6875rem] font-semibold text-zinc-400 uppercase tracking-wider">{l("name")}</span>
            </th>
            {dates.map((d, i) => {
              const isToday = i === todayCol;
              const p = parts(d.date);
              const prev = i > 0 ? parts(dates[i - 1].date) : null;
              // Every rehearsal is a Sunday, so "Sun" ×26 was noise — lead with
              // the day number, mark where the month turns over, and only spell
              // out a weekday when it isn't the usual one (performance dates).
              const showMonth = !prev || prev.month !== p.month || prev.year !== p.year;
              const monthLabel = p.obj.toLocaleDateString(locale, { month: "short" });
              const weekday = p.weekday !== 0 ? p.obj.toLocaleDateString(locale, { weekday: "short" }) : null;
              return (
                <th
                  key={d.date}
                  ref={isToday ? todayColRef : undefined}
                  scope="col"
                  aria-label={[
                    p.obj.toLocaleDateString(locale, { month: "long", day: "numeric", weekday: "long" }),
                    d.title,
                    d.allHands ? l("allHands") : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  title={[d.title, d.time, d.venue?.name, d.allHands ? l("allHands") : null].filter(Boolean).join(" · ") || undefined}
                  className={`relative border-b border-r px-0.5 pt-1.5 pb-1.5 text-center align-bottom ${d.date < localISODate() && !d.special ? "opacity-50" : ""} ${
                    d.isPerformance
                      ? "bg-amber-900/40 text-amber-300 border-zinc-800"
                      : d.special
                        ? "bg-violet-900/30 text-violet-200 border-zinc-800"
                        : isToday
                        ? "bg-blue-900/40 text-blue-200 border-blue-700/50"
                        : "bg-zinc-900 text-zinc-300 border-zinc-800"
                  } ${showMonth && i > 0 ? "border-l border-l-zinc-600" : ""}`}
                >
                  <div className={`text-[0.6875rem] leading-none font-semibold h-3 ${showMonth ? (isToday ? "text-blue-300" : "text-zinc-400") : weekday ? (d.special ? "text-violet-300" : "text-zinc-400") : "text-transparent"}`}>
                    {showMonth ? monthLabel : (weekday ?? "·")}
                  </div>
                  {d.allHands && (
                    <span aria-hidden="true" className="absolute top-0.5 right-1 text-[0.625rem] leading-none text-amber-400">
                      ★
                    </span>
                  )}
                  <div className="tabular text-base sm:text-lg leading-tight font-bold mt-0.5">{p.day}</div>
                  <div
                      className={`text-[0.6875rem] leading-none font-semibold mt-0.5 h-3 whitespace-nowrap ${
                        d.isPerformance ? "text-amber-400" : d.special ? "text-violet-300" : isToday ? "text-blue-300" : "text-zinc-400"
                      }`}
                    >
                      {d.isPerformance
                        ? l("show")
                        : d.special
                          ? l("coachShort")
                        : isToday
                          ? d.date === localISODate()
                            ? lang === "ko" ? "오늘" : "Today"
                            : lang === "ko" ? "다음" : "Next"
                          : weekday}
                    </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.role || "_flat"}>
              {isActors && (
                <tr>
                  <th
                    scope="rowgroup"
                    className="sticky left-0 z-10 bg-zinc-900 px-2.5 py-1.5 border-b border-zinc-800 text-left"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.role)}
                      aria-expanded={!collapsed.has(group.role)}
                      className="w-full min-h-9 flex items-center gap-1.5 whitespace-nowrap text-left rounded hover:text-zinc-100"
                    >
                      <Icon
                        name="chevronDown"
                        className={`w-3.5 h-3.5 shrink-0 text-zinc-500 transition-transform duration-200 ${collapsed.has(group.role) ? "-rotate-90" : ""}`}
                      />
                      <span className={`w-2 h-2 rounded-full shrink-0 ${ROLE_DOT_COLOR[group.role] ?? "bg-zinc-600"}`} />
                      <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-zinc-300">
                        {l(group.role as Parameters<typeof t>[1])}
                      </span>
                      <span className="tabular text-[0.6875rem] text-zinc-400">{group.people.length}</span>
                    </button>
                  </th>
                  {dates.map((d, i) => (
                    <td key={d.date} className={`border-b border-zinc-800 ${i === todayCol ? "bg-blue-950/40" : "bg-zinc-900"}`} />
                  ))}
                </tr>
              )}
              {(isActors && collapsed.has(group.role) ? [] : group.people).map((person) => {
                const effectiveRole = pendingRoles.has(person.id) ? (pendingRoles.get(person.id) ?? null) : person.role;
                const rolePending = pendingRoles.has(person.id);
                // days marked absent, counting unsaved edits; shown as a tiny number after the name
                let missed = 0;
                for (const d of dates) {
                  if (!attends({ ...person, department }, d, roleTeams)) continue;
                  const k = key(person.id, d.date);
                  if ((pendingChanges.has(k) ? pendingChanges.get(k) : statusMap.get(k)) === "no") missed++;
                }
                return (
                  <tr key={person.id} className="group">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-zinc-950 group-hover:bg-zinc-900 transition-colors border-b border-r border-zinc-800 pl-0.5 pr-1.5 sm:pl-1.5 sm:pr-2 text-left font-normal"
                    >
                      <div className="flex items-center gap-0.5 sm:gap-1.5 min-w-0">
                        {isActors && (
                          <span
                            className="relative inline-flex shrink-0"
                            title={person.also_role ? `${l("also")} ${l(person.also_role as Parameters<typeof t>[1])}` : undefined}
                          >
                          {isActors && !readOnly && (
                            <RoleDot
                              role={effectiveRole}
                              pending={rolePending}
                              personId={person.id}
                              personName={person.name}
                              onRoleChange={onRoleChange!}
                              lang={lang}
                            />
                          )}
                          {isActors && readOnly && (
                            <span className={`ml-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${effectiveRole ? ROLE_DOT_COLOR[effectiveRole] : "bg-zinc-600"}`} />
                          )}
                            {person.also_role && (
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none absolute left-1/2 top-1/2 translate-x-[2px] translate-y-[2px] w-2 h-2 rounded-full ring-2 ring-zinc-950 ${ROLE_DOT_COLOR[person.also_role] ?? "bg-zinc-500"}`}
                              />
                            )}
                          </span>
                        )}
                        {!isActors && <span className="w-1.5 shrink-0" />}
                        {onNameClick ? (
                          <button
                            type="button"
                            onClick={() => onNameClick(person.id)}
                            className="text-sm text-zinc-100 truncate min-w-0 text-left rounded hover:underline decoration-zinc-600 underline-offset-2"
                            aria-label={`${person.name} — ${l("attendanceSummary")}`}
                          >
                            {person.name}
                          </button>
                        ) : (
                          <span className="text-sm text-zinc-100 truncate min-w-0">{person.name}</span>
                        )}
                        {missed > 0 && (
                          <span
                            className="shrink-0 tabular text-[0.625rem] leading-none text-zinc-500"
                            title={`${l("missedTotal")}: ${missed}`}
                            aria-label={`${l("missedTotal")}: ${missed}`}
                          >
                            {missed}
                          </span>
                        )}
                        {isActors && person.character_name && (
                          <span className="text-xs text-zinc-400 shrink-0 hidden sm:inline truncate">
                            {displayCharacterName(person.character_name, lang)}
                          </span>
                        )}
                        {!isActors && person.character_name && (
                          <span className="ml-auto shrink-0 max-w-[45%] truncate px-1.5 py-0.5 rounded-md text-[0.6875rem] font-medium bg-zinc-800 text-zinc-300">
                            {displayCharacterName(person.character_name, lang)}
                          </span>
                        )}
                        {isActors && person.team && (
                          <span
                            className={`ml-auto shrink-0 w-5 h-5 rounded-md text-[0.6875rem] font-bold flex items-center justify-center ${
                              person.team === "A"
                                ? "bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/30"
                                : "bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30"
                            }`}
                            title={`Team ${person.team}`}
                          >
                            {person.team}
                          </span>
                        )}
                      </div>
                    </th>
                    {dates.map((d, i) => {
                      const k = key(person.id, d.date);
                      const status = pendingChanges.has(k) ? pendingChanges.get(k)! : (statusMap.get(k) ?? defaultStatus);
                      const isPending = pendingChanges.has(k);
                      const isToday = i === todayCol;
                      const justTapped = !!lastToggled && lastToggled.startsWith(k + "#");
                      if (!attends({ ...person, department }, d, roleTeams)) {
                        return (
                          <td key={d.date} className="p-0 border-b border-r border-zinc-800/80 bg-zinc-900/60">
                            <div className="h-10 sm:h-9 flex items-center justify-center text-zinc-700" aria-hidden="true">
                              ·
                            </div>
                          </td>
                        );
                      }
                      const tint = `${d.isPerformance && status === "yes" ? "bg-amber-950/20" : ""} ${isToday && status === "yes" ? "bg-blue-950/30" : ""} ${d.special && status === "yes" ? "bg-violet-950/25" : ""} ${STATUS_BG_CLASS[status]}`;
                      const symbol = (
                        <span
                          key={justTapped ? lastToggled! : "static"}
                          className={`text-sm sm:text-base leading-none ${STATUS_TEXT_CLASS[status]} ${justTapped ? "anim-cell" : ""}`}
                          aria-hidden="true"
                        >
                          {STATUS_SYMBOL[status]}
                        </span>
                      );
                      return (
                        <td
                          key={d.date}
                          className={`p-0 border-b border-r ${d.date < localISODate() && !isPending && !d.special ? "opacity-50" : ""} ${isToday ? "border-blue-700/30" : "border-zinc-800/80"} ${tint}`}
                        >
                          {readOnly ? (
                            <div className="h-10 sm:h-9 flex items-center justify-center">{symbol}</div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onToggle!(person.id, d.date)}
                              aria-label={`${person.name}, ${parts(d.date).obj.toLocaleDateString(locale, { month: "long", day: "numeric" })}: ${statusWord(status)}`}
                              className={`relative w-full h-10 sm:h-9 flex items-center justify-center select-none transition-colors ${STATUS_HOVER_CLASS[status]} ${
                                isPending ? "ring-2 ring-inset ring-blue-400/70" : ""
                              }`}
                            >
                              {symbol}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
