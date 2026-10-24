"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePreferences } from "@/lib/prefs";
import { useBrand } from "@/components/BrandProvider";
import { t, STATUS_CYCLE, STATUS_CYCLE_UNSET, teamLabel, type DepartmentKey } from "@/lib/i18n";
import type { Person, Notice, UpdateLogEntry } from "@/lib/types";
import type { SeasonDate, SiteSettings, Team } from "@/lib/season";
import OnboardingModal from "@/components/OnboardingModal";
import SettingsModal from "@/components/SettingsModal";
import NoticesModal from "@/components/NoticesModal";
import CalendarModal from "@/components/CalendarModal";
import AttendanceSummary from "@/components/AttendanceSummary";
import UpdateLog from "@/components/UpdateLog";
import WhoSavingModal from "@/components/WhoSavingModal";
import RoleFilterChips from "@/components/RoleFilterChips";
import DDayCounter from "@/components/DDayCounter";
import ScheduleTable from "@/components/ScheduleTable";
import ResourcesModal from "@/components/ResourcesModal";
import { DeptTabs, StatusLegend } from "@/components/ScheduleChrome";
import { Button, ErrorScreen, Icon, IconButton, LoadingScreen, Logo, Sheet, useToast } from "@/components/ui";

function key(personId: number, date: string) {
  return `${personId}:${date}`;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T12:00:00");
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

function loadSeenNoticeIds(): Set<number> {
  try {
    const raw = localStorage.getItem("seenNoticeIds");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export default function ScheduleApp() {
  const { prefs, setPrefs, ready } = usePreferences();
  const centered = useBrand().header === "centered";
  const lang = prefs.lang;
  const ko = lang === "ko";
  const l = (k: Parameters<typeof t>[1]) => t(lang, k);
  const [teams, setTeams] = useState<Team[]>([]);
  const [site, setSite] = useState<SiteSettings | null>(null);
  const deptLabel = (d: DepartmentKey) => teamLabel(teams, d, lang);
  const { toast, show: showToast } = useToast();

  const [people, setPeople] = useState<Person[]>([]);
  const [dates, setDates] = useState<SeasonDate[]>([]);
  const [showStart, setShowStart] = useState<string | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<"yes" | "unset">("yes");
  const [breaks, setBreaks] = useState<{ from: string; to: string }[]>([]);
  const [statusMap, setStatusMap] = useState(new Map<string, string>());
  const [logs, setLogs] = useState<UpdateLogEntry[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(new Map<string, string>());
  const [pendingRoles, setPendingRoles] = useState(new Map<number, string | null>());
  const [department, setDepartment] = useState<DepartmentKey>(prefs.department);
  const [roleFilter, setRoleFilter] = useState("All");
  const [whoSavingOpen, setWhoSavingOpen] = useState(false);
  // bumped on every open so the save sheet starts blank each time
  const [saveSheetKey, setSaveSheetKey] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryFocus, setSummaryFocus] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [seenNoticeIds, setSeenNoticeIds] = useState<Set<number>>(() => new Set());
  // "personId:date#n" — only the cell just tapped plays its pop animation
  const [lastToggled, setLastToggled] = useState<string | null>(null);
  const tapCount = useRef(0);
  // a department switch that would throw away unsaved edits waits here for a
  // confirm instead of silently discarding them, as it used to
  const [pendingDept, setPendingDept] = useState<DepartmentKey | null>(null);

  useEffect(() => {
    setSeenNoticeIds(loadSeenNoticeIds());
  }, []);

  function resetEdits() {
    setPendingChanges(new Map());
    setPendingRoles(new Map());
    setLastToggled(null);
  }

  useEffect(() => {
    // only reload when the tab actually changes: setting loading for the team
    // already on screen would never clear (no new fetch runs)
    if (ready && prefs.department !== department) {
      resetEdits();
      setRoleFilter("All");
      setLoading(true);
      setDepartment(prefs.department);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.department]);

  const applyResponse = (data: {
    people: Person[];
    dates: SeasonDate[];
    showStart: string | null;
    defaultStatus?: "yes" | "unset";
    breaks?: { from: string; to: string }[];
    teams?: Team[];
    site?: SiteSettings;
    responses: { person_id: number; date: string; status: string }[];
    logs: UpdateLogEntry[];
    notices: Notice[];
  }) => {
    setPeople(data.people);
    setDates(data.dates);
    setShowStart(data.showStart ?? null);
    setTeams(data.teams ?? []);
    setSite(data.site ?? null);
    setDefaultStatus(data.defaultStatus ?? "yes");
    setBreaks(data.breaks ?? []);
    setLogs(data.logs);
    setNotices(data.notices ?? []);
    const m = new Map<string, string>();
    for (const r of data.responses) m.set(key(r.person_id, r.date), r.status);
    setStatusMap(m);
  };

  const fetchSchedule = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch(`/api/schedule?department=${department}`);
      const data = await res.json();
      if (!res.ok || !data.people) throw new Error(data.error ?? "load_failed");
      applyResponse(data);
      setLoading(false);
    } catch {
      setLoadError(true);
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const changeCount = pendingChanges.size + pendingRoles.size;
  const discardLabel = ko ? "변경 취소" : "Discard changes";
  const hasUnsaved = changeCount > 0;
  const requireReason = Array.from(pendingChanges.values()).some((status) => status === "no");

  const upcomingUnseenCount = useMemo(
    () => notices.filter((n) => daysUntil(n.notice_date) >= 0 && !seenNoticeIds.has(n.id)).length,
    [notices, seenNoticeIds]
  );

  // closing the tab with unsaved edits would lose them without a word
  useEffect(() => {
    if (!hasUnsaved) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsaved]);

  async function doSave(savedBy: string, reason?: string) {
    setSaving(true);
    try {
      const statusChanges = Array.from(pendingChanges.entries()).map(([k, status]) => {
        const [personId, date] = k.split(":");
        return { person_id: parseInt(personId), date, status };
      });
      const roleChanges = Array.from(pendingRoles.entries()).map(([personId, role]) => ({
        personId,
        role,
      }));
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedBy, statusChanges, roleChanges, department, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.people) throw new Error(data.error ?? "save_failed");
      applyResponse(data);
      resetEdits();
      setWhoSavingOpen(false);
      showToast(ko ? "저장했습니다" : "Saved");
    } catch {
      showToast(ko ? "저장하지 못했습니다. 다시 시도해 주세요." : "Save failed. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function doRevert(logId: number, name: string, password: string) {
    try {
      const res = await fetch("/api/schedule/revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId, revertedBy: name, department, password }),
      });
      const data = await res.json();
      if (res.status === 401) throw new Error("wrong_password");
      if (!res.ok || data.error) throw new Error(data.error ?? "revert_failed");
      applyResponse(data);
      resetEdits();
      showToast(ko ? "되돌렸습니다" : "Reverted");
    } catch (e) {
      // the revert sheet shows this inline, next to the field it's about
      throw new Error(e instanceof Error && e.message === "wrong_password" ? "wrong_password" : "revert_failed");
    }
  }

  function toggleCell(personId: number, date: string) {
    const k = key(personId, date);
    const original = statusMap.get(k) ?? defaultStatus;
    const current = pendingChanges.has(k) ? pendingChanges.get(k)! : original;
    const next = (defaultStatus === "unset" ? STATUS_CYCLE_UNSET : STATUS_CYCLE)[current];
    setPendingChanges((prev) => {
      const copy = new Map(prev);
      if (next === original) copy.delete(k);
      else copy.set(k, next);
      return copy;
    });
    tapCount.current += 1;
    setLastToggled(`${k}#${tapCount.current}`);
  }

  function changeRole(personId: number, role: string | null) {
    setPendingRoles((prev) => {
      const copy = new Map(prev);
      const person = people.find((p) => p.id === personId);
      if (person && person.role === role) copy.delete(personId);
      else copy.set(personId, role);
      return copy;
    });
  }

  function openSaveSheet() {
    setSaveSheetKey((k) => k + 1);
    setWhoSavingOpen(true);
  }

  function switchDepartment(d: DepartmentKey) {
    resetEdits();
    setRoleFilter("All");
    setLoading(true);
    setDepartment(d);
  }

  function requestDepartment(d: DepartmentKey) {
    if (d === department) return;
    if (hasUnsaved) setPendingDept(d);
    else switchDepartment(d);
  }

  function openNotices() {
    setNoticesOpen(true);
    const ids = new Set([...seenNoticeIds, ...notices.map((n) => n.id)]);
    setSeenNoticeIds(ids);
    try {
      localStorage.setItem("seenNoticeIds", JSON.stringify([...ids]));
    } catch {
      // ignore
    }
  }

  const usesRoles = !!teams.find((tm) => tm.key === department)?.uses_roles;

  // a remembered team that no longer exists (renamed or removed on /admin) falls back to the first one
  useEffect(() => {
    if (!loading && teams.length > 0 && !teams.some((tm) => tm.key === department)) {
      setLoading(true);
      setDepartment(teams[0].key);
      setPrefs({ department: teams[0].key });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, teams, department]);

  const filteredPeople = people.filter((p) => {
    if (roleFilter === "All") return true;
    const effective = pendingRoles.has(p.id) ? pendingRoles.get(p.id) : p.role;
    if (p.also_role === roleFilter) return true;
    return roleFilter === "Unassigned" ? effective === null : effective === roleFilter;
  });

  if (loadError) {
    return (
      <ErrorScreen
        lang={lang}
        onRetry={() => {
          setLoading(true);
          fetchSchedule();
        }}
      />
    );
  }

  if (!ready || loading) return <LoadingScreen lang={lang} />;

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 pb-[calc(4.75rem+env(safe-area-inset-bottom))] sm:pb-0">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-6 pb-6">
        <header className="mb-4 sm:mb-5">
          {centered ? (
            <>
            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
              {notices.length > 0 && (
                <IconButton label={l("notices")} icon="bell" onClick={openNotices} badge={upcomingUnseenCount} />
              )}
              <IconButton label={l("calendar")} icon="calendar" onClick={() => setCalendarOpen(true)} />
              <IconButton label={l("resources")} icon="link" onClick={() => setResourcesOpen(true)}>
                <span className="hidden sm:inline text-xs font-medium">{l("resources")}</span>
              </IconButton>
              <IconButton label={l("settings")} icon="gear" onClick={() => setSettingsOpen(true)} />
              <div className="hidden sm:flex items-center gap-2 ml-1">
                {hasUnsaved && <DiscardButton label={discardLabel} onClick={resetEdits} />}
                <SaveButton count={changeCount} label={l("save")} onClick={openSaveSheet} />
              </div>
            </div>
              <div className="flex flex-col items-center text-center gap-2 mt-1">
                <Logo className="w-16 sm:w-20" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 leading-tight">{site?.title[lang] || l("title")}</h1>
                <DDayCounter lang={lang} showStart={showStart} />
              </div>
            </>
          ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <Logo className="w-10 sm:w-12" />
              <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-zinc-100 leading-tight">{site?.title[lang] || l("title")}</h1>
              <DDayCounter lang={lang} showStart={showStart} />
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {notices.length > 0 && (
                <IconButton label={l("notices")} icon="bell" onClick={openNotices} badge={upcomingUnseenCount} />
              )}
              <IconButton label={l("calendar")} icon="calendar" onClick={() => setCalendarOpen(true)} />
              <IconButton label={l("resources")} icon="link" onClick={() => setResourcesOpen(true)}>
                <span className="hidden sm:inline text-xs font-medium">{l("resources")}</span>
              </IconButton>
              <IconButton label={l("settings")} icon="gear" onClick={() => setSettingsOpen(true)} />
              <div className="hidden sm:flex items-center gap-2 ml-1">
                {hasUnsaved && <DiscardButton label={discardLabel} onClick={resetEdits} />}
                <SaveButton count={changeCount} label={l("save")} onClick={openSaveSheet} />
              </div>
            </div>
          </div>
          )}
          <p className={`text-sm text-zinc-400 mt-1.5 leading-relaxed ${centered ? "text-center" : ""}`}>
            {l("tapToCycle")} <span className="text-emerald-500 font-semibold">✓</span> {l("yes")}
            <span className="text-zinc-500" aria-hidden="true"> → </span>
            <span className="text-red-400 font-semibold">✕</span> {l("no")}
            {defaultStatus === "unset" && (
              <>
                <span className="text-zinc-500" aria-hidden="true"> → </span>
                <span className="text-zinc-300 font-semibold">–</span> {l("unset")}
              </>
            )}
            <span className="tabular text-zinc-500 whitespace-nowrap">
              {" "}· {dates.length} {l("dates")} · {people.length} {l("people")}
            </span>
          </p>
        </header>

        <DeptTabs
          keys={teams.map((tm) => tm.key)}
          value={department}
          onChange={requestDepartment}
          labelFor={deptLabel}
          trailing={
            <button
              type="button"
              onClick={() => {
                setSummaryFocus(null);
                setSummaryOpen(true);
              }}
              aria-label={l("attendanceSummary")}
              className="press inline-flex items-center gap-1.5 min-h-9 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 active:bg-zinc-600 whitespace-nowrap"
            >
              <Icon name="list" className="w-4 h-4 hidden min-[400px]:block" />
              {l("attendanceShort")}
            </button>
          }
        />

        {usesRoles && (
          <div className="mb-3 sm:mb-4 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 [scrollbar-width:none]">
            <RoleFilterChips active={roleFilter} onChange={setRoleFilter} lang={lang} />
          </div>
        )}

        {teams.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-12 text-center text-sm text-zinc-400 space-y-3">
            <p>{ko ? "아직 팀이 없어요. 관리 페이지에서 팀, 멤버, 일정을 만들어 주세요." : "No teams yet. Set up teams, members and dates on the admin page."}</p>
            <Link href="/admin" className="inline-flex items-center min-h-11 px-4 rounded-xl bg-blue-600 text-white font-semibold">
              {ko ? "관리 페이지 열기" : "Open admin"}
            </Link>
          </div>
        ) : people.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-12 text-center text-sm text-zinc-400">
            {l("noPeopleYet")}
          </div>
        ) : (
          <ScheduleTable
            people={filteredPeople}
            dates={dates}
            statusMap={statusMap}
            pendingChanges={pendingChanges}
            onToggle={toggleCell}
            onRoleChange={changeRole}
            pendingRoles={pendingRoles}
            lang={lang}
            department={department}
            usesRoles={usesRoles}
            lastToggled={lastToggled}
            defaultStatus={defaultStatus}
            onNameClick={(id) => {
              setSummaryFocus(id);
              setSummaryOpen(true);
            }}
          />
        )}

        <StatusLegend lang={lang} showRoles={usesRoles} showUnset={defaultStatus === "unset"} showAlso={people.some((p) => !!p.also_role)} />

        <div className="mt-5 sm:mt-6">
          <UpdateLog logs={logs} lang={lang} onRevert={doRevert} />
        </div>
      </div>

      {/* Mobile save bar — also where "you have unsaved edits" lives. That used
          to be a banner inserted ABOVE the table on the first tap, which shoved
          every row down ~60px so the next tap landed on the wrong person.
          Padding uses max() so it keeps 10px on phones without a home
          indicator; a bare env() bottom padding used to collapse it to 0. */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-zinc-900/90 backdrop-blur-md border-t border-zinc-800 px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          {hasUnsaved && <DiscardButton label={discardLabel} onClick={resetEdits} tall />}
          <div className="flex-1">
            <SaveButton count={changeCount} label={l("save")} onClick={openSaveSheet} full />
          </div>
        </div>
      </div>

      <OnboardingModal teams={teams} />
      <WhoSavingModal
        key={saveSheetKey}
        open={whoSavingOpen}
        onClose={() => setWhoSavingOpen(false)}
        onSave={doSave}
        people={people}
        saving={saving}
        lang={lang}
        requireReason={requireReason}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        teams={teams}
      />
      <NoticesModal notices={notices} lang={lang} open={noticesOpen} onClose={() => setNoticesOpen(false)} />
      <AttendanceSummary
        usesRoles={usesRoles}
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        people={people}
        dates={dates}
        statusMap={statusMap}
        pendingChanges={pendingChanges}
        defaultStatus={defaultStatus}
        focusId={summaryFocus}
        lang={lang}
      />
      <CalendarModal dates={dates} breaks={breaks} notices={notices} lang={lang} open={calendarOpen} onClose={() => setCalendarOpen(false)} />
      <ResourcesModal open={resourcesOpen} onClose={() => setResourcesOpen(false)} lang={lang} />
      <Sheet
        open={pendingDept !== null}
        onClose={() => setPendingDept(null)}
        title={ko ? "변경사항을 버릴까요?" : "Discard your changes?"}
        icon="alert"
        footer={
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setPendingDept(null)}>
              {ko ? "계속 편집" : "Keep editing"}
            </Button>
            <Button
              variant="warning"
              className="flex-1"
              onClick={() => {
                const d = pendingDept!;
                setPendingDept(null);
                switchDepartment(d);
              }}
            >
              {ko ? "버리고 이동" : "Discard"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-zinc-300 leading-relaxed">
          {ko
            ? `저장하지 않은 변경 ${changeCount}건이 있습니다. ${pendingDept ? deptLabel(pendingDept) : ""} 탭으로 이동하면 사라집니다.`
            : `You have ${changeCount} unsaved ${changeCount === 1 ? "change" : "changes"}. Switching to ${pendingDept ? deptLabel(pendingDept) : ""} will discard ${changeCount === 1 ? "it" : "them"}.`}
        </p>
      </Sheet>
      {toast}
    </div>
  );
}

function DiscardButton({ label, onClick, tall }: { label: string; onClick: () => void; tall?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`anim-fade press shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 active:bg-zinc-600 ${
        tall ? "w-12 h-12" : "h-9 px-3 text-sm font-medium"
      }`}
    >
      <Icon name="undo" className="w-4 h-4" />
      {!tall && <span>{label}</span>}
    </button>
  );
}

function SaveButton({
  count,
  label,
  onClick,
  full,
}: {
  count: number;
  label: string;
  onClick: () => void;
  full?: boolean;
}) {
  const active = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!active}
      className={`press inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold ${
        full ? "w-full min-h-12" : "min-h-9 px-4"
      } ${
        active
          ? "bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 shadow-lg shadow-blue-600/25"
          : "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
      }`}
    >
      {label}
      {active && (
        // keyed on the count so each new change re-runs the bump
        <span
          key={count}
          className="anim-bump tabular min-w-5 h-5 px-1.5 rounded-full bg-white/20 text-white text-xs font-bold leading-5 text-center"
        >
          {count}
        </span>
      )}
    </button>
  );
}
