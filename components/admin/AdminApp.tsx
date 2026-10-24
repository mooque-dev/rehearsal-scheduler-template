"use client";

// The /admin page: everything a company needs to set up and run a season without
// touching code — members, teams, the calendar (single dates and repeating
// cycles, breaks, venues), notices, and the site title.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePreferences } from "@/lib/prefs";
import { t, displayCharacterName } from "@/lib/i18n";
import { inBreak, weeklyDates } from "@/lib/season";
import type { AdminState } from "@/lib/adminTypes";
import { Button, Icon, Logo, Segmented, Sheet, useToast, LoadingScreen, ErrorScreen } from "@/components/ui";
import BrandingSection from "@/components/admin/BrandingSection";
import { Badge, ChipPicker, DeleteButton, MoveButtons, Row, SelectField, TextField, Toggle } from "@/components/admin/fields";

type Tab = "members" | "teams" | "schedule" | "notices" | "branding" | "general";
type Person = AdminState["people"][number];
type TeamRow = AdminState["teams"][number];
type Session = AdminState["sessions"][number];
type Venue = AdminState["venues"][number];
type BreakRow = AdminState["breaks"][number];
type NoticeRow = AdminState["notices"][number];

type Editor =
  | { kind: "person"; row: Partial<Person> }
  | { kind: "team"; row: Partial<TeamRow> }
  | { kind: "session"; row: Partial<Session> }
  | { kind: "cycle" }
  | { kind: "break"; row: Partial<BreakRow> }
  | { kind: "venue"; row: Partial<Venue> }
  | { kind: "notice"; row: Partial<NoticeRow> }
  | null;

const ROLES = ["Main/Sub", "Ensemble", "Coach"] as const;
const SPECIALTIES = ["music", "vocal", "acting"] as const;

export default function AdminApp() {
  const { prefs, setPrefs } = usePreferences();
  const lang = prefs.lang;
  const ko = lang === "ko";
  const tx = (k: string, e: string) => (ko ? k : e);
  const locale = ko ? "ko-KR" : "en-US";
  const { toast, show } = useToast();

  const [state, setState] = useState<AdminState | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<Tab>("members");
  const [teamKey, setTeamKey] = useState<string>("");
  const [editor, setEditor] = useState<Editor>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch("/api/admin");
      if (res.status === 401) return window.location.reload();
      if (!res.ok) throw new Error();
      setState(await res.json());
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ERRORS: Record<string, string> = {
    missing_field: tx("필수 항목을 입력해 주세요.", "Please fill in the required field."),
    too_long: tx("입력이 너무 길어요.", "That's too long."),
    invalid_date: tx("날짜를 확인해 주세요.", "Please check the date."),
    duplicate: tx("이미 같은 날짜(또는 이름)가 있어요.", "That date (or name) already exists."),
    team_not_empty: tx("멤버가 있는 팀은 삭제할 수 없어요. 먼저 멤버를 옮기거나 삭제하세요.", "Move or remove this team's members first."),
    end_before_start: tx("끝 날짜가 시작 날짜보다 빨라요.", "The end date is before the start date."),
    unknown_team: tx("팀을 선택해 주세요.", "Please pick a team."),
    invalid_image: tx("이미지를 올리지 못했어요. 더 작은 PNG, JPG 또는 SVG로 해 주세요.", "Couldn't use that image. Try a smaller PNG, JPG or SVG."),
  };

  /** Run one admin action; returns true when it worked. */
  async function act(action: string, payload: Record<string, unknown> = {}, success?: string): Promise<boolean> {
    setBusy(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (res.status === 401) {
        window.location.reload();
        return false;
      }
      if (!res.ok) {
        show(ERRORS[data.error] ?? tx("저장하지 못했어요. 다시 시도해 주세요.", "Couldn't save. Please try again."), "error");
        return false;
      }
      setState(data);
      if (typeof data.note === "string" && data.note.startsWith("added:")) {
        const [, added, skipped] = data.note.split(":");
        show(
          tx(`${added}개 날짜를 추가했어요${Number(skipped) ? ` (이미 있던 ${skipped}개 제외)` : ""}`, `Added ${added} dates${Number(skipped) ? ` (${skipped} already existed)` : ""}`)
        );
      } else if (success) show(success);
      return true;
    } catch {
      show(tx("연결에 실패했어요.", "Connection failed."), "error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const teams = useMemo(() => state?.teams ?? [], [state]);
  const activeTeam = teams.find((tm) => tm.key === teamKey) ?? teams[0];
  const anyRoleTeam = teams.some((tm) => tm.uses_roles);
  const teamName = (key: string) => {
    const tm = teams.find((x) => x.key === key);
    return tm ? (ko ? tm.name_ko || tm.name_en : tm.name_en) : key;
  };
  const roleName = (r: string) => t(lang, r as Parameters<typeof t>[1]);
  const fmt = (d: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }) =>
    new Date(d + "T12:00:00").toLocaleDateString(locale, opts);

  if (loadError) return <ErrorScreen lang={lang} onRetry={load} />;
  if (!state) return <LoadingScreen lang={lang} />;

  const venueName = (id: number | null) => state.venues.find((v) => v.id === id)?.name;
  const savedOk = tx("저장했어요", "Saved");
  const deletedOk = tx("삭제했어요", "Deleted");

  async function signOut() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "members", label: tx("멤버", "Members") },
    { key: "teams", label: tx("팀", "Teams") },
    { key: "schedule", label: tx("일정", "Schedule") },
    { key: "notices", label: tx("공지", "Notices") },
    { key: "branding", label: tx("브랜딩", "Branding") },
    { key: "general", label: tx("기본 설정", "General") },
  ];

  // ── sections ───────────────────────────────────────────────────────────────

  const members = (
    <section aria-label={tx("멤버", "Members")} className="space-y-3">
      {teams.length === 0 ? (
        <EmptyState
          text={tx("먼저 팀을 만들어 주세요.", "Create a team first.")}
          action={tx("팀 만들기", "Create a team")}
          onAction={() => {
            setTab("teams");
            setEditor({ kind: "team", row: {} });
          }}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label={tx("팀", "Team")}>
            {teams.map((tm) => (
              <button
                key={tm.key}
                type="button"
                aria-pressed={tm.key === activeTeam?.key}
                onClick={() => setTeamKey(tm.key)}
                className={`press min-h-10 px-3.5 rounded-full text-sm font-medium border ${
                  tm.key === activeTeam?.key ? "bg-blue-600 text-white border-blue-500" : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
                }`}
              >
                {teamName(tm.key)} <span className="tabular opacity-70">{tm.members}</span>
              </button>
            ))}
          </div>
          <Button variant="primary" className="w-full sm:w-auto" onClick={() => setEditor({ kind: "person", row: { department: activeTeam?.key } })}>
            + {tx("멤버 추가", "Add member")}
          </Button>
          <ul className="rounded-xl border border-zinc-800 bg-zinc-900/60">
            {state.people.filter((p) => p.department === activeTeam?.key).length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-zinc-400">{tx("아직 멤버가 없어요.", "No members yet.")}</li>
            )}
            {state.people
              .filter((p) => p.department === activeTeam?.key)
              .map((p) => (
                <Row
                  key={p.id}
                  title={p.name}
                  onClick={() => setEditor({ kind: "person", row: p })}
                  badges={
                    <>
                      {p.role && <Badge tone="blue">{roleName(p.role)}</Badge>}
                      {p.team && <Badge>{p.team}</Badge>}
                      {p.also_role && <Badge tone="emerald">+ {roleName(p.also_role)}</Badge>}
                    </>
                  }
                  sub={p.character_name ? displayCharacterName(p.character_name, lang) : undefined}
                  trailing={
                    <MoveButtons
                      labelUp={tx("위로", "Move up")}
                      labelDown={tx("아래로", "Move down")}
                      onUp={() => act("person.move", { id: p.id, dir: -1 })}
                      onDown={() => act("person.move", { id: p.id, dir: 1 })}
                    />
                  }
                />
              ))}
          </ul>
        </>
      )}
    </section>
  );

  const teamsSection = (
    <section aria-label={tx("팀", "Teams")} className="space-y-3">
      <p className="text-sm text-zinc-400 leading-relaxed">
        {tx(
          "팀은 일정표의 탭이에요. '역할로 묶기'를 켜면 주/조연·앙상블·코치로 나뉘어 보여요.",
          "Teams are the tabs of the schedule. Turn on “group by role” to split a team into leads, ensemble and coaches."
        )}
      </p>
      <Button variant="primary" className="w-full sm:w-auto" onClick={() => setEditor({ kind: "team", row: { uses_roles: false } })}>
        + {tx("팀 추가", "Add team")}
      </Button>
      <ul className="rounded-xl border border-zinc-800 bg-zinc-900/60">
        {teams.map((tm) => (
          <Row
            key={tm.id}
            title={teamName(tm.key)}
            sub={`${ko ? tm.name_en : tm.name_ko} · ${tx(`멤버 ${tm.members}명`, `${tm.members} members`)}`}
            badges={tm.uses_roles ? <Badge tone="blue">{tx("역할로 묶기", "By role")}</Badge> : undefined}
            onClick={() => setEditor({ kind: "team", row: tm })}
            trailing={
              <MoveButtons
                labelUp={tx("위로", "Move up")}
                labelDown={tx("아래로", "Move down")}
                onUp={() => act("team.move", { id: tm.id, dir: -1 })}
                onDown={() => act("team.move", { id: tm.id, dir: 1 })}
              />
            }
          />
        ))}
      </ul>
    </section>
  );

  const months = new Map<string, Session[]>();
  for (const s of state.sessions) {
    const k = s.date.slice(0, 7);
    months.set(k, [...(months.get(k) ?? []), s]);
  }

  const schedule = (
    <section aria-label={tx("일정", "Schedule")} className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <Button variant="primary" onClick={() => setEditor({ kind: "cycle" })}>
          {tx("반복 일정 추가", "Add repeating dates")}
        </Button>
        <Button onClick={() => setEditor({ kind: "session", row: {} })}>+ {tx("날짜 하나 추가", "Add one date")}</Button>
      </div>

      {state.sessions.length === 0 && (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-8 text-center text-sm text-zinc-400">
          {tx("아직 일정이 없어요. '반복 일정 추가'로 매주 연습을 한 번에 만들 수 있어요.", "No dates yet. “Add repeating dates” creates a weekly rehearsal in one go.")}
        </p>
      )}
      {[...months.entries()].map(([month, rows]) => (
        <div key={month}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            {new Date(month + "-15T12:00:00").toLocaleDateString(locale, { year: "numeric", month: "long" })}
          </h3>
          <ul className="rounded-xl border border-zinc-800 bg-zinc-900/60">
            {rows.map((s) => (
              <Row
                key={s.id}
                title={fmt(s.date)}
                onClick={() => setEditor({ kind: "session", row: s })}
                badges={
                  <>
                    {s.is_performance && <Badge tone="amber">{t(lang, "show")}</Badge>}
                    {s.special && <Badge tone="violet">{tx("특별", "Special")}</Badge>}
                    {s.all_hands && <Badge tone="amber">★ {tx("전체", "All")}</Badge>}
                    {(s.teams?.length || s.roles?.length) && <Badge>{tx("일부만", "Some")}</Badge>}
                  </>
                }
                sub={[s.title, s.time, venueName(s.venue_id)].filter(Boolean).join(" · ") || undefined}
              />
            ))}
          </ul>
        </div>
      ))}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{tx("쉬는 기간", "Breaks")}</h3>
          <button type="button" onClick={() => setEditor({ kind: "break", row: {} })} className="min-h-10 px-3 text-sm font-medium text-blue-400 hover:text-blue-300">
            + {tx("추가", "Add")}
          </button>
        </div>
        <ul className="rounded-xl border border-zinc-800 bg-zinc-900/60">
          {state.breaks.length === 0 && <li className="px-4 py-4 text-sm text-zinc-400">{tx("없음", "None")}</li>}
          {state.breaks.map((b) => (
            <Row key={b.id} title={`${fmt(b.from)} – ${fmt(b.to)}`} sub={b.label ?? undefined} onClick={() => setEditor({ kind: "break", row: b })} />
          ))}
        </ul>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{tx("장소", "Venues")}</h3>
          <button type="button" onClick={() => setEditor({ kind: "venue", row: {} })} className="min-h-10 px-3 text-sm font-medium text-blue-400 hover:text-blue-300">
            + {tx("추가", "Add")}
          </button>
        </div>
        <ul className="rounded-xl border border-zinc-800 bg-zinc-900/60">
          {state.venues.length === 0 && <li className="px-4 py-4 text-sm text-zinc-400">{tx("없음", "None")}</li>}
          {state.venues.map((v) => (
            <Row key={v.id} title={v.name} sub={v.address ?? undefined} onClick={() => setEditor({ kind: "venue", row: v })} />
          ))}
        </ul>
      </div>
    </section>
  );

  const notices = (
    <section aria-label={tx("공지", "Notices")} className="space-y-3">
      <Button variant="primary" className="w-full sm:w-auto" onClick={() => setEditor({ kind: "notice", row: {} })}>
        + {tx("공지 추가", "Add notice")}
      </Button>
      <ul className="rounded-xl border border-zinc-800 bg-zinc-900/60">
        {state.notices.length === 0 && <li className="px-4 py-8 text-center text-sm text-zinc-400">{tx("공지가 없어요.", "No notices.")}</li>}
        {state.notices.map((n) => (
          <Row key={n.id} title={n.title} sub={[fmt(n.notice_date), n.time_info].filter(Boolean).join(" · ")} onClick={() => setEditor({ kind: "notice", row: n })} />
        ))}
      </ul>
    </section>
  );

  const general = <GeneralSection state={state} tx={tx} busy={busy} onSave={(p) => act("settings.save", p, savedOk)} onReset={() => act("demo.reset", {}, tx("데모를 처음 상태로 되돌렸어요", "Demo reset"))} />;

  // ── editors ───────────────────────────────────────────────────────────────

  const close = () => setEditor(null);
  const saveThen = async (action: string, payload: Record<string, unknown>, msg = savedOk) => {
    if (await act(action, payload, msg)) close();
  };

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-6 pb-16">
        <header className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo className="w-10" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{tx("관리", "Admin")}</p>
              <h1 className="text-lg sm:text-xl font-bold truncate">{state.site.title[lang]}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setPrefs({ lang: ko ? "en" : "ko" })}
              className="press min-h-10 px-3 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
            >
              {ko ? "EN" : "한국어"}
            </button>
            <Link href="/" className="press min-h-10 px-3 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-800">
              <Icon name="calendar" className="w-4 h-4" />
              <span className="hidden sm:inline">{tx("일정표 보기", "View schedule")}</span>
            </Link>
            <button type="button" onClick={signOut} className="press min-h-10 px-3 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800">
              {tx("나가기", "Sign out")}
            </button>
          </div>
        </header>

        {state.demo && (
          <p className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/25 px-4 py-3 text-sm text-amber-200 leading-relaxed">
            {tx(
              "데모 사이트예요. 바꾼 내용은 이 링크를 여는 모두에게 보여요. ‘기본 설정’에서 언제든 처음 상태로 되돌릴 수 있어요.",
              "This is a demo. Changes are visible to everyone with the link. You can reset it any time under General."
            )}
          </p>
        )}

        <nav role="tablist" className="flex gap-1 border-b border-zinc-800 -mx-3 px-3 sm:mx-0 sm:px-0 mb-4 overflow-x-auto [scrollbar-width:none]">
          {TABS.map((x) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={tab === x.key}
              onClick={() => setTab(x.key)}
              className={`relative min-h-11 px-3.5 text-sm font-medium whitespace-nowrap ${tab === x.key ? "text-blue-400" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              {x.label}
              <span aria-hidden="true" className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-blue-500 transition-transform ${tab === x.key ? "scale-x-100" : "scale-x-0"}`} />
            </button>
          ))}
        </nav>

        <div key={tab} className="anim-fade">
          {tab === "members" && members}
          {tab === "teams" && teamsSection}
          {tab === "schedule" && schedule}
          {tab === "notices" && notices}
          {tab === "branding" && <BrandingSection state={state} tx={tx} lang={lang} busy={busy} act={act} onToast={show} />}
          {tab === "general" && general}
        </div>
      </div>

      {editor?.kind === "person" && (
        <PersonEditor
          key={editor.row.id ?? "new"}
          row={editor.row}
          teams={teams}
          tx={tx}
          lang={lang}
          busy={busy}
          teamName={teamName}
          roleName={roleName}
          onClose={close}
          onSave={(p) => saveThen("person.save", p)}
          onDelete={(id) => saveThen("person.delete", { id }, deletedOk)}
        />
      )}
      {editor?.kind === "team" && (
        <TeamEditor
          row={editor.row}
          tx={tx}
          busy={busy}
          onClose={close}
          onSave={(p) => saveThen("team.save", p)}
          onDelete={(id) => saveThen("team.delete", { id }, deletedOk)}
        />
      )}
      {editor?.kind === "session" && (
        <SessionEditor
          row={editor.row}
          state={state}
          tx={tx}
          busy={busy}
          teamName={teamName}
          roleName={roleName}
          anyRoleTeam={anyRoleTeam}
          onClose={close}
          onSave={(p) => saveThen("session.save", p)}
          onDelete={(id) => saveThen("session.delete", { id }, deletedOk)}
        />
      )}
      {editor?.kind === "cycle" && (
        <CycleEditor state={state} tx={tx} lang={lang} busy={busy} onClose={close} onSave={(p) => saveThen("cycle.create", p, "")} />
      )}
      {editor?.kind === "break" && (
        <SimpleEditor
          title={tx("쉬는 기간", "Break")}
          fields={[
            { key: "from", label: tx("시작", "From"), type: "date" },
            { key: "to", label: tx("끝", "To"), type: "date" },
            { key: "label", label: tx("메모 (선택)", "Label (optional)"), placeholder: tx("예: 연말 휴식", "e.g. Holiday break") },
          ]}
          row={editor.row as Record<string, unknown>}
          tx={tx}
          busy={busy}
          onClose={close}
          onSave={(p) => saveThen("break.save", p)}
          onDelete={(id) => saveThen("break.delete", { id }, deletedOk)}
        />
      )}
      {editor?.kind === "venue" && (
        <SimpleEditor
          title={tx("장소", "Venue")}
          fields={[
            { key: "name", label: tx("이름", "Name"), placeholder: tx("예: 스튜디오 A", "e.g. Studio A") },
            { key: "address", label: tx("주소 (지도 링크용, 선택)", "Address (for the map link, optional)") },
          ]}
          row={editor.row as Record<string, unknown>}
          tx={tx}
          busy={busy}
          onClose={close}
          onSave={(p) => saveThen("venue.save", p)}
          onDelete={(id) => saveThen("venue.delete", { id }, deletedOk)}
        />
      )}
      {editor?.kind === "notice" && (
        <SimpleEditor
          title={tx("공지", "Notice")}
          fields={[
            { key: "title", label: tx("제목", "Title") },
            { key: "notice_date", label: tx("날짜", "Date"), type: "date" },
            { key: "time_info", label: tx("시간 (선택)", "Time (optional)"), placeholder: "4–7 PM" },
            {
              key: "content",
              label: tx("내용", "Details"),
              multiline: true,
              hint: tx("링크는 [지도 보기](https://…) 형식으로 쓸 수 있어요.", "Links: write [Map](https://…)."),
            },
          ]}
          row={editor.row as Record<string, unknown>}
          tx={tx}
          busy={busy}
          onClose={close}
          onSave={(p) => saveThen("notice.save", p)}
          onDelete={(id) => saveThen("notice.delete", { id }, deletedOk)}
        />
      )}
      {toast}
    </div>
  );
}

type Tx = (ko: string, en: string) => string;

function EmptyState({ text, action, onAction }: { text: string; action: string; onAction: () => void }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-10 text-center space-y-3">
      <p className="text-sm text-zinc-400">{text}</p>
      <Button variant="primary" onClick={onAction}>
        {action}
      </Button>
    </div>
  );
}

function EditorFooter({
  tx,
  busy,
  canSave,
  onSave,
  onDelete,
  deleteDisabled,
}: {
  tx: Tx;
  busy: boolean;
  canSave: boolean;
  onSave: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {onDelete && <DeleteButton label={tx("삭제", "Delete")} confirmLabel={tx("한 번 더 눌러 삭제", "Tap again to delete")} onConfirm={onDelete} disabled={busy || deleteDisabled} />}
      <Button variant="primary" className="flex-1" disabled={!canSave || busy} onClick={onSave}>
        {busy ? tx("저장 중…", "Saving…") : tx("저장", "Save")}
      </Button>
    </div>
  );
}

function PersonEditor({
  row,
  teams,
  tx,
  lang,
  busy,
  teamName,
  roleName,
  onClose,
  onSave,
  onDelete,
}: {
  row: Partial<Person>;
  teams: TeamRow[];
  tx: Tx;
  lang: "ko" | "en";
  busy: boolean;
  teamName: (k: string) => string;
  roleName: (r: string) => string;
  onClose: () => void;
  onSave: (p: Record<string, unknown>) => void;
  onDelete: (id: number) => void;
}) {
  const [name, setName] = useState(row.name ?? "");
  const [department, setDepartment] = useState(row.department ?? teams[0]?.key ?? "");
  const [role, setRole] = useState(row.role ?? "");
  const [ab, setAb] = useState(row.team ?? "");
  const [also, setAlso] = useState(row.also_role ?? "");
  const spec = row.character_name?.startsWith("spec:") ? row.character_name.slice(5) : "";
  const [specialty, setSpecialty] = useState(spec);
  const [character, setCharacter] = useState(spec ? "" : (row.character_name ?? ""));
  const usesRoles = !!teams.find((tm) => tm.key === department)?.uses_roles;

  const roleOptions = [{ value: "", label: tx("미지정", "Unassigned") }, ...ROLES.map((r) => ({ value: r, label: roleName(r) }))];
  return (
    <Sheet
      open
      onClose={onClose}
      title={row.id ? tx("멤버 수정", "Edit member") : tx("멤버 추가", "Add member")}
      icon="user"
      closeLabel={tx("닫기", "Close")}
      footer={
        <EditorFooter
          tx={tx}
          busy={busy}
          canSave={!!name.trim() && !!department}
          onDelete={row.id ? () => onDelete(row.id!) : undefined}
          onSave={() =>
            onSave({
              id: row.id,
              name,
              department,
              role: usesRoles ? role || null : null,
              team: usesRoles ? ab || null : null,
              also_role: usesRoles ? also || null : null,
              character_name: usesRoles && role === "Coach" ? (specialty ? `spec:${specialty}` : null) : character || null,
            })
          }
        />
      }
    >
      <div className="space-y-4">
        <TextField label={tx("이름", "Name")} value={name} onChange={setName} autoFocus={!row.id} placeholder={tx("예: 김하나 (Hana)", "e.g. Hana Kim")} />
        <SelectField label={tx("팀", "Team")} value={department} onChange={setDepartment} options={teams.map((tm) => ({ value: tm.key, label: teamName(tm.key) }))} />
        {usesRoles && (
          <>
            <SelectField label={tx("역할", "Role")} value={role} onChange={setRole} options={roleOptions} />
            <SelectField
              label={tx("A/B 팀 (선택)", "A/B cast (optional)")}
              value={ab}
              onChange={setAb}
              options={[
                { value: "", label: tx("없음", "None") },
                { value: "A", label: "A" },
                { value: "B", label: "B" },
              ]}
            />
            <SelectField
              label={tx("겸임 (선택)", "Also in (optional)")}
              value={also}
              onChange={setAlso}
              options={[{ value: "", label: tx("없음", "None") }, ...ROLES.filter((r) => r !== role).map((r) => ({ value: r, label: roleName(r) }))]}
            />
            {role === "Coach" ? (
              <SelectField
                label={tx("분야", "Specialty")}
                value={specialty}
                onChange={setSpecialty}
                options={[{ value: "", label: tx("없음", "None") }, ...SPECIALTIES.map((s) => ({ value: s, label: displayCharacterName(`spec:${s}`, lang) }))]}
              />
            ) : (
              <TextField label={tx("배역 / 메모 (선택)", "Character / note (optional)")} value={character} onChange={setCharacter} />
            )}
          </>
        )}
        {!usesRoles && <TextField label={tx("담당 / 메모 (선택)", "Position / note (optional)")} value={character} onChange={setCharacter} placeholder={tx("예: 조명", "e.g. Lighting")} />}
        {row.id && <p className="text-xs text-zinc-400">{tx("삭제하면 이 멤버의 출석 기록도 함께 지워져요.", "Deleting also removes this member's attendance answers.")}</p>}
      </div>
    </Sheet>
  );
}

function TeamEditor({
  row,
  tx,
  busy,
  onClose,
  onSave,
  onDelete,
}: {
  row: Partial<TeamRow>;
  tx: Tx;
  busy: boolean;
  onClose: () => void;
  onSave: (p: Record<string, unknown>) => void;
  onDelete: (id: number) => void;
}) {
  const [en, setEn] = useState(row.name_en ?? "");
  const [koName, setKo] = useState(row.name_ko ?? "");
  const [usesRoles, setUsesRoles] = useState(!!row.uses_roles);
  return (
    <Sheet
      open
      onClose={onClose}
      title={row.id ? tx("팀 수정", "Edit team") : tx("팀 추가", "Add team")}
      icon="list"
      closeLabel={tx("닫기", "Close")}
      footer={
        <EditorFooter
          tx={tx}
          busy={busy}
          canSave={!!en.trim()}
          onDelete={row.id ? () => onDelete(row.id!) : undefined}
          deleteDisabled={(row.members ?? 0) > 0}
          onSave={() => onSave({ id: row.id, name_en: en, name_ko: koName, uses_roles: usesRoles })}
        />
      }
    >
      <div className="space-y-4">
        <TextField label={tx("영어 이름", "Name (English)")} value={en} onChange={setEn} autoFocus={!row.id} placeholder="Cast" />
        <TextField label={tx("한국어 이름", "Name (Korean)")} value={koName} onChange={setKo} placeholder="배우팀" hint={tx("비워 두면 영어 이름을 써요.", "Leave empty to use the English name.")} />
        <Toggle
          label={tx("역할로 묶기", "Group by role")}
          hint={tx("주/조연 · 앙상블 · 코치로 나눠 보여요 (배우팀에 추천).", "Splits the tab into leads, ensemble and coaches (good for a cast).")}
          checked={usesRoles}
          onChange={setUsesRoles}
        />
        {(row.members ?? 0) > 0 && (
          <p className="text-xs text-zinc-400">{tx("멤버가 있는 팀은 삭제할 수 없어요.", "A team with members can't be deleted.")}</p>
        )}
      </div>
    </Sheet>
  );
}

function SessionEditor({
  row,
  state,
  tx,
  busy,
  teamName,
  roleName,
  anyRoleTeam,
  onClose,
  onSave,
  onDelete,
}: {
  row: Partial<Session>;
  state: AdminState;
  tx: Tx;
  busy: boolean;
  teamName: (k: string) => string;
  roleName: (r: string) => string;
  anyRoleTeam: boolean;
  onClose: () => void;
  onSave: (p: Record<string, unknown>) => void;
  onDelete: (id: number) => void;
}) {
  const [date, setDate] = useState(row.date ?? "");
  const [title, setTitle] = useState(row.title ?? "");
  const [time, setTime] = useState(row.time ?? "");
  const [venue, setVenue] = useState(row.venue_id ? String(row.venue_id) : "");
  const [perf, setPerf] = useState(!!row.is_performance);
  const [special, setSpecial] = useState(!!row.special);
  const [allHands, setAllHands] = useState(!!row.all_hands);
  const [teams, setTeams] = useState<string[]>(row.teams ?? []);
  const [roles, setRoles] = useState<string[]>(row.roles ?? []);
  return (
    <Sheet
      open
      onClose={onClose}
      title={row.id ? tx("날짜 수정", "Edit date") : tx("날짜 추가", "Add date")}
      icon="calendar"
      width="md"
      closeLabel={tx("닫기", "Close")}
      footer={
        <EditorFooter
          tx={tx}
          busy={busy}
          canSave={!!date}
          onDelete={row.id ? () => onDelete(row.id!) : undefined}
          onSave={() =>
            onSave({ id: row.id, date, title, time, venue_id: venue || null, is_performance: perf, special, all_hands: allHands, teams, roles })
          }
        />
      }
    >
      <div className="space-y-4">
        <TextField label={tx("날짜", "Date")} type="date" value={date} onChange={setDate} />
        <TextField label={tx("내용 (선택)", "What (optional)")} value={title} onChange={setTitle} placeholder={tx("예: 런스루, 1막 점검", "e.g. Run-through, Act 1 check")} />
        <TextField label={tx("시간 (선택)", "Time (optional)")} value={time} onChange={setTime} placeholder="4–7 PM" />
        <SelectField
          label={tx("장소", "Venue")}
          value={venue}
          onChange={setVenue}
          options={[{ value: "", label: tx("미정", "Not set") }, ...state.venues.map((v) => ({ value: String(v.id), label: v.name }))]}
        />
        <Toggle label={tx("공연", "Performance")} hint={tx("노란색으로 표시되고 D-day가 켜져요.", "Shown in amber; turns on the countdown.")} checked={perf} onChange={setPerf} />
        <Toggle label={tx("특별 일정", "Special session")} hint={tx("보라색으로 표시돼요 (예: 코치 방문).", "Shown in violet (e.g. a visiting coach).")} checked={special} onChange={setSpecial} />
        <Toggle label={tx("전체 참석", "Everyone attends")} hint={tx("★ 표시가 붙어요.", "Marked with a ★.")} checked={allHands} onChange={setAllHands} />
        {state.teams.length > 1 && (
          <ChipPicker
            label={tx("참석 팀", "Teams attending")}
            hint={tx("아무것도 안 고르면 모든 팀이에요. 나머지 팀은 회색으로 비활성돼요.", "None picked = every team. Other teams get a greyed-out cell.")}
            options={state.teams.map((tm) => ({ value: tm.key, label: teamName(tm.key) }))}
            value={teams}
            onChange={setTeams}
          />
        )}
        {anyRoleTeam && (
          <ChipPicker
            label={tx("참석 역할", "Roles attending")}
            hint={tx("역할로 묶은 팀에만 적용돼요. 안 고르면 모든 역할.", "Applies to teams grouped by role. None picked = every role.")}
            options={ROLES.map((r) => ({ value: r, label: roleName(r) }))}
            value={roles}
            onChange={setRoles}
          />
        )}
        {row.id && row.date && date !== row.date && (
          <p className="text-xs text-zinc-400">{tx("날짜를 바꾸면 이미 받은 출석 답도 새 날짜로 옮겨져요.", "Changing the date moves the answers already given to the new date.")}</p>
        )}
      </div>
    </Sheet>
  );
}

function CycleEditor({
  state,
  tx,
  lang,
  busy,
  onClose,
  onSave,
}: {
  state: AdminState;
  tx: Tx;
  lang: "ko" | "en";
  busy: boolean;
  onClose: () => void;
  onSave: (p: Record<string, unknown>) => void;
}) {
  const [weekday, setWeekday] = useState("0");
  const [every, setEvery] = useState("1");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState(state.venues[0] ? String(state.venues[0].id) : "");
  const [skipBreaks, setSkipBreaks] = useState(true);

  const preview = useMemo(() => {
    if (!start || !end || end < start) return null;
    const existing = new Set(state.sessions.map((s) => s.date));
    const dates = weeklyDates(start, end, Number(weekday), Number(every)).filter((d) => !(skipBreaks && inBreak(d, state.breaks)));
    return { total: dates.length, fresh: dates.filter((d) => !existing.has(d)).length };
  }, [start, end, weekday, every, skipBreaks, state]);

  const dayNames = Array.from({ length: 7 }, (_, i) =>
    new Date(2026, 10, 1 + i).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", { weekday: "long" })
  ); // Nov 1 2026 is a Sunday
  return (
    <Sheet
      open
      onClose={onClose}
      title={tx("반복 일정 추가", "Add repeating dates")}
      icon="calendar"
      width="md"
      closeLabel={tx("닫기", "Close")}
      footer={
        <EditorFooter
          tx={tx}
          busy={busy}
          canSave={!!preview && preview.fresh > 0}
          onSave={() => onSave({ weekday: Number(weekday), every: Number(every), start, end, title, time, venue_id: venue || null, skipBreaks })}
        />
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <SelectField label={tx("요일", "Day")} value={weekday} onChange={setWeekday} options={dayNames.map((d, i) => ({ value: String(i), label: d }))} />
          <SelectField
            label={tx("간격", "Repeat")}
            value={every}
            onChange={setEvery}
            options={[
              { value: "1", label: tx("매주", "Every week") },
              { value: "2", label: tx("격주", "Every 2 weeks") },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label={tx("시작", "From")} type="date" value={start} onChange={setStart} />
          <TextField label={tx("끝", "Until")} type="date" value={end} onChange={setEnd} />
        </div>
        <TextField label={tx("내용 (선택)", "What (optional)")} value={title} onChange={setTitle} placeholder={tx("예: 정기 연습", "e.g. Rehearsal")} />
        <div className="grid grid-cols-2 gap-3">
          <TextField label={tx("시간", "Time")} value={time} onChange={setTime} placeholder="4–7 PM" />
          <SelectField
            label={tx("장소", "Venue")}
            value={venue}
            onChange={setVenue}
            options={[{ value: "", label: tx("미정", "Not set") }, ...state.venues.map((v) => ({ value: String(v.id), label: v.name }))]}
          />
        </div>
        <Toggle label={tx("쉬는 기간 건너뛰기", "Skip breaks")} checked={skipBreaks} onChange={setSkipBreaks} />
        <p className="rounded-xl bg-zinc-800/60 px-3.5 py-3 text-sm text-zinc-300" aria-live="polite">
          {!preview
            ? tx("시작과 끝 날짜를 고르면 몇 개가 생기는지 보여드려요.", "Pick a start and end date to see how many dates this makes.")
            : tx(
                `날짜 ${preview.total}개 · 새로 추가 ${preview.fresh}개${preview.total - preview.fresh ? ` (이미 있는 ${preview.total - preview.fresh}개는 그대로)` : ""}`,
                `${preview.total} dates · ${preview.fresh} new${preview.total - preview.fresh ? ` (${preview.total - preview.fresh} already there stay as they are)` : ""}`
              )}
        </p>
      </div>
    </Sheet>
  );
}

function SimpleEditor({
  title,
  fields,
  row,
  tx,
  busy,
  onClose,
  onSave,
  onDelete,
}: {
  title: string;
  fields: { key: string; label: string; type?: "text" | "date"; placeholder?: string; multiline?: boolean; hint?: string }[];
  row: Record<string, unknown>;
  tx: Tx;
  busy: boolean;
  onClose: () => void;
  onSave: (p: Record<string, unknown>) => void;
  onDelete: (id: number) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, row[f.key] == null ? "" : String(row[f.key])]))
  );
  const first = fields[0].key;
  const required = fields.filter((f) => f.type === "date" || f.key === first).every((f) => values[f.key].trim());
  return (
    <Sheet
      open
      onClose={onClose}
      title={title}
      icon="pin"
      width="md"
      closeLabel={tx("닫기", "Close")}
      footer={
        <EditorFooter
          tx={tx}
          busy={busy}
          canSave={required}
          onDelete={row.id ? () => onDelete(Number(row.id)) : undefined}
          onSave={() => onSave({ id: row.id, ...values })}
        />
      }
    >
      <div className="space-y-4">
        {fields.map((f, i) => (
          <TextField
            key={f.key}
            label={f.label}
            type={f.type}
            value={values[f.key]}
            onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
            placeholder={f.placeholder}
            multiline={f.multiline}
            hint={f.hint}
            autoFocus={i === 0 && !row.id && f.type !== "date"}
          />
        ))}
      </div>
    </Sheet>
  );
}

function GeneralSection({
  state,
  tx,
  busy,
  onSave,
  onReset,
}: {
  state: AdminState;
  tx: Tx;
  busy: boolean;
  onSave: (p: Record<string, unknown>) => void;
  onReset: () => void;
}) {
  const [en, setEn] = useState(state.site.title.en);
  const [koTitle, setKo] = useState(state.site.title.ko);
  const [def, setDef] = useState<"yes" | "unset">(state.defaultStatus);
  return (
    <section className="space-y-5">
      <TextField label={tx("이름 (영어)", "Name (English)")} value={en} onChange={setEn} />
      <TextField label={tx("이름 (한국어)", "Name (Korean)")} value={koTitle} onChange={setKo} hint={tx("일정표 맨 위와 브라우저 탭에 보여요.", "Shown at the top of the schedule.")} />
      <div>
        <p className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{tx("아직 답하지 않은 칸", "Cells nobody has answered")}</p>
        <Segmented
          label={tx("기본 상태", "Default")}
          value={def}
          onChange={setDef}
          options={[
            { value: "unset", label: "–", sub: tx("미선택 (추천)", "Not selected (recommended)") },
            { value: "yes", label: "✓", sub: tx("참석으로 간주", "Counted as attending") },
          ]}
        />
      </div>
      <Button variant="primary" className="w-full sm:w-auto" disabled={busy || !en.trim()} onClick={() => onSave({ titleEn: en, titleKo: koTitle, defaultStatus: def })}>
        {tx("저장", "Save")}
      </Button>

      {state.demo && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <p className="text-sm text-zinc-300">
            {tx("데모 데이터를 처음 상태로 되돌려요. 지금까지 바꾼 내용은 모두 사라져요.", "Put the demo back to its starting state. Every change made so far is lost.")}
          </p>
          <DeleteButton label={tx("데모 초기화", "Reset demo")} confirmLabel={tx("한 번 더 눌러 초기화", "Tap again to reset")} onConfirm={onReset} disabled={busy} />
        </div>
      )}
    </section>
  );
}
