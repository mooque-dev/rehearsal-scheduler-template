"use client";

import { useCallback, useEffect, useState } from "react";
import { usePreferences } from "@/lib/prefs";
import { t, seasonDeptLabel, type DepartmentKey } from "@/lib/i18n";
import type { Person, Notice, UpdateLogEntry } from "@/lib/types";
import type { SeasonDate } from "@/lib/season";
import SettingsModal from "@/components/SettingsModal";
import NoticesModal from "@/components/NoticesModal";
import CalendarModal from "@/components/CalendarModal";
import UpdateLog from "@/components/UpdateLog";
import RoleFilterChips from "@/components/RoleFilterChips";
import ScheduleTable from "@/components/ScheduleTable";
import { DeptTabs, StatusLegend } from "@/components/ScheduleChrome";
import { ErrorScreen, Icon, IconButton, LoadingScreen, Logo } from "@/components/ui";

function key(personId: number, date: string) {
  return `${personId}:${date}`;
}

export default function ArchiveApp() {
  const { prefs, ready } = usePreferences();
  const l = (k: Parameters<typeof t>[1]) => t(prefs.lang, k);

  const [people, setPeople] = useState<Person[]>([]);
  const [dates, setDates] = useState<SeasonDate[]>([]);
  const [statusMap, setStatusMap] = useState(new Map<string, string>());
  const [logs, setLogs] = useState<UpdateLogEntry[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [department, setDepartment] = useState<DepartmentKey>("actors");
  const [roleFilter, setRoleFilter] = useState("All");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch(`/api/archive/schedule?department=${department}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "load_failed");
      setPeople(data.people ?? []);
      setDates(data.dates ?? []);
      setLogs(data.logs ?? []);
      setNotices(data.notices ?? []);
      const m = new Map<string, string>();
      for (const r of data.responses ?? []) m.set(key(r.person_id, r.date), r.status);
      setStatusMap(m);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const filteredPeople = people.filter((p) => {
    if (roleFilter === "All") return true;
    return roleFilter === "Unassigned" ? p.role === null : p.role === roleFilter;
  });

  if (loadError) return <ErrorScreen lang={prefs.lang} onRetry={fetchSchedule} />;
  if (!ready || loading) return <LoadingScreen lang={prefs.lang} />;

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <header className="mb-4 sm:mb-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <Logo className="w-10 sm:w-12" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 leading-tight">{l("title")}</h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {notices.length > 0 && (
                <IconButton label={l("notices")} icon="bell" onClick={() => setNoticesOpen(true)} />
              )}
              <IconButton label={l("calendar")} icon="calendar" onClick={() => setCalendarOpen(true)} />
              <IconButton label={l("settings")} icon="gear" onClick={() => setSettingsOpen(true)} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-900/30 border border-amber-600/30 text-xs font-semibold text-amber-300">
              <Icon name="archive" className="w-3.5 h-3.5" />
              {l("archiveReadOnly")}
            </span>
            <span className="tabular text-sm text-zinc-400">
              {dates.length} {l("dates")} · {people.length} {l("people")}
            </span>
          </div>
        </header>

        <DeptTabs
          value={department}
          onChange={(d: DepartmentKey) => {
            setRoleFilter("All");
            setDepartment(d);
          }}
          labelFor={(d) => seasonDeptLabel(d, prefs.lang)}
        />

        {department === "actors" && (
          <div className="mb-3 sm:mb-4 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 [scrollbar-width:none]">
            <RoleFilterChips active={roleFilter} onChange={setRoleFilter} lang={prefs.lang} />
          </div>
        )}

        <ScheduleTable
          people={filteredPeople}
          dates={dates}
          statusMap={statusMap}
          pendingChanges={new Map()}
          pendingRoles={new Map()}
          lang={prefs.lang}
          department={department}
        />

        <StatusLegend lang={prefs.lang} showRoles={department === "actors"} showMaybe />

        <div className="mt-5 sm:mt-6">
          <UpdateLog logs={logs} lang={prefs.lang} />
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} showDepartment={false} />
      <NoticesModal notices={notices} lang={prefs.lang} open={noticesOpen} onClose={() => setNoticesOpen(false)} />
      <CalendarModal dates={dates} breaks={[]} notices={notices} lang={prefs.lang} open={calendarOpen} onClose={() => setCalendarOpen(false)} />
    </div>
  );
}
