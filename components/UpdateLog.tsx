"use client";

import { useEffect, useRef, useState } from "react";
import { storageKey } from "@/lib/site.config";
import { t, type Lang } from "@/lib/i18n";
import type { LogChange, UpdateLogEntry } from "@/lib/types";
import { Button, FieldLabel, Icon, Sheet, inputClass } from "@/components/ui";

function formatLogDate(iso: string, lang: Lang): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(lang === "ko" ? "ko-KR" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

const STATUS_STYLE: Record<string, { symbol: string; className: string }> = {
  yes: { symbol: "✓", className: "text-emerald-500" },
  maybe: { symbol: "?", className: "text-amber-400" },
  no: { symbol: "✕", className: "text-red-400" },
  unset: { symbol: "–", className: "text-zinc-400" },
};

function formatChangeDate(date: string, lang: Lang): string {
  return new Date(date + "T12:00:00").toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

/** one row per person + resulting status, with their dates joined */
function groupChanges(details: LogChange[]) {
  const groups = new Map<string, { person: string; to: LogChange["to"]; dates: string[] }>();
  for (const d of details) {
    const key = `${d.person}|${d.to}`;
    const g = groups.get(key) ?? { person: d.person, to: d.to, dates: [] };
    g.dates.push(d.date);
    groups.set(key, g);
  }
  return [...groups.values()].map((g) => ({ ...g, dates: g.dates.sort() }));
}

// Small saves read inline; a bulk save (dozens of cells) folds behind a toggle.
const INLINE_GROUPS = 2;

const NAME_KEY = storageKey("Reverter");

/** one row per person: ✕ 불참 · dates */
function ChangeList({ details, lang }: { details: LogChange[]; lang: Lang }) {
  return (
    <ul className="space-y-1">
      {groupChanges(details).map((g) => {
        const st = g.to ? STATUS_STYLE[g.to] : null;
        return (
          <li key={`${g.person}|${g.to}`} className="text-[0.8125rem] text-zinc-400 flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-zinc-200 font-medium">{g.person}</span>
            {st && g.to && (
              <span className={`font-semibold ${st.className}`}>
                {st.symbol} {t(lang, g.to)}
              </span>
            )}
            <span className="tabular">{g.dates.map((d) => formatChangeDate(d, lang)).join(", ")}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function UpdateLog({
  logs,
  lang,
  onRevert,
}: {
  logs: UpdateLogEntry[];
  lang: Lang;
  /** rejects with Error("wrong_password") or Error("revert_failed") */
  onRevert?: (logId: number, name: string, password: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [target, setTarget] = useState<UpdateLogEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [openDetails, setOpenDetails] = useState<Set<number>>(new Set());
  const nameRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const l = (k: Parameters<typeof t>[1]) => t(lang, k);
  const visible = expanded ? logs : logs.slice(0, 5);

  function openRevert(entry: UpdateLogEntry) {
    let saved = "";
    try {
      saved = localStorage.getItem(NAME_KEY) ?? "";
    } catch {
      // private mode — they just type it
    }
    setName(saved);
    setPassword("");
    setError(null);
    setTarget(entry);
  }

  // Land on the first thing still to fill in: the password if their name is
  // remembered, otherwise the name. Deferred so it runs after the sheet has
  // taken focus itself.
  useEffect(() => {
    if (!target) return;
    const id = setTimeout(() => (nameRef.current?.value ? pwRef : nameRef).current?.focus(), 80);
    return () => clearTimeout(id);
  }, [target]);

  async function submit() {
    if (!onRevert || !target || busy || !name.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      await onRevert(target.id, name.trim(), password);
      try {
        localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        // not remembering is fine
      }
      setTarget(null);
      setPassword("");
    } catch (e) {
      const wrong = e instanceof Error && e.message === "wrong_password";
      setError(l(wrong ? "wrongPassword" : "revertFailed"));
      setPassword("");
      setShaking(true);
      setTimeout(() => setShaking(false), 350);
      setTimeout(() => pwRef.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <section className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-900/40">
      <button
        type="button"
        onClick={() => setPanelOpen(!panelOpen)}
        aria-expanded={panelOpen}
        className="w-full min-h-12 flex items-center justify-between px-4 py-3 bg-zinc-900 hover:bg-zinc-800/80 transition-colors"
      >
        <span className="text-sm font-semibold text-zinc-200">
          {l("updateLog")}
          <span className="tabular font-normal text-zinc-400 ml-2">{logs.length}</span>
        </span>
        <Icon
          name="chevronDown"
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${panelOpen ? "rotate-180" : ""}`}
        />
      </button>
      {!panelOpen ? null : logs.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-zinc-400">{l("noLogYet")}</div>
      ) : (
        <ul className="divide-y divide-zinc-800 border-t border-zinc-800">
          {visible.map((entry) => {
            const canRevert = !!onRevert && !!entry.changes_json && !entry.reverted;
            return (
              <li key={entry.id} className="px-4 py-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className={`min-w-0 leading-relaxed ${entry.reverted ? "opacity-55" : ""}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-blue-400 font-semibold">{entry.saved_by}</span>
                      <span className="tabular text-zinc-400 text-xs">{formatLogDate(entry.created_at, lang)}</span>
                      {entry.reverted && (
                        <span className="text-[0.6875rem] px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-medium">
                          {l("reverted")}
                        </span>
                      )}
                    </div>
                    <p className={`text-zinc-300 break-words ${entry.reverted ? "line-through decoration-zinc-600" : ""}`}>
                      {entry.summary}
                    </p>
                    {entry.details && entry.details.length > 0 && (() => {
                      const groups = groupChanges(entry.details);
                      const folded = groups.length > INLINE_GROUPS;
                      const open = !folded || openDetails.has(entry.id);
                      return (
                        <div className="mt-1.5">
                          {folded && (
                            <button
                              type="button"
                              aria-expanded={open}
                              onClick={() =>
                                setOpenDetails((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(entry.id)) next.delete(entry.id);
                                  else next.add(entry.id);
                                  return next;
                                })
                              }
                              className="text-xs font-medium text-zinc-400 hover:text-zinc-100 underline underline-offset-2 decoration-zinc-600"
                            >
                              {open ? l("hideDetails") : `${l("showDetails")} (${groups.length})`}
                            </button>
                          )}
                          {open && (
                            <div className={folded ? "mt-1.5" : ""}>
                              <ChangeList details={entry.details!} lang={lang} />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  {canRevert && (
                    <button
                      type="button"
                      onClick={() => openRevert(entry)}
                      aria-label={`${l("revert")} — ${entry.saved_by}, ${formatLogDate(entry.created_at, lang)}`}
                      className="press shrink-0 -my-0.5 min-h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/70 text-xs font-medium text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
                    >
                      <Icon name="undo" className="w-3.5 h-3.5" />
                      {l("revert")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
          {!expanded && logs.length > 5 && (
            <li>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="w-full min-h-11 px-4 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
              >
                <span className="tabular">{logs.length - 5}</span> {l("showMore")}
              </button>
            </li>
          )}
        </ul>
      )}
    </section>

    <Sheet
      open={!!target}
      onClose={() => setTarget(null)}
      dismissable={!busy}
      icon="undo"
      title={l("revertTitle")}
      closeLabel={l("close")}
      footer={
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setTarget(null)} disabled={busy}>
            {l("cancel")}
          </Button>
          <Button variant="warning" className="flex-1" onClick={submit} disabled={busy || !name.trim() || !password}>
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {l("revert")}
              </span>
            ) : (
              l("revert")
            )}
          </Button>
        </div>
      }
    >
      {target && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {/* what's about to be undone, so nobody reverts the wrong entry */}
          <div className="rounded-xl border border-zinc-700/70 bg-zinc-800/40 p-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-blue-400 font-semibold text-sm">{target.saved_by}</span>
              <span className="tabular text-zinc-400 text-xs">{formatLogDate(target.created_at, lang)}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-200 break-words">{target.summary}</p>
            {target.details && target.details.length > 0 && (
              <div className="mt-2 pt-2 border-t border-zinc-700/60">
                <ChangeList details={target.details} lang={lang} />
              </div>
            )}
          </div>
          <p className="text-sm text-zinc-400 mb-5 leading-relaxed">{l("revertWillRestore")}</p>

          <div className="mb-4">
            <FieldLabel htmlFor="revert-name">{l("yourName")}</FieldLabel>
            <input
              id="revert-name"
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={l("enterName")}
              autoComplete="name"
              enterKeyHint="next"
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel htmlFor="revert-password">{l("adminPassword")}</FieldLabel>
            <input
              id="revert-password"
              ref={pwRef}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "revert-error" : undefined}
              autoComplete="off"
              enterKeyHint="done"
              className={`${inputClass} ${shaking ? "anim-shake" : ""} ${error ? "!border-red-500 focus:!ring-red-500/25" : ""}`}
            />
            {error && (
              <p id="revert-error" role="alert" className="mt-2 text-sm text-red-400">
                {error}
              </p>
            )}
          </div>
          {/* lets Enter submit from either field */}
          <button type="submit" tabIndex={-1} aria-hidden className="sr-only" />
        </form>
      )}
    </Sheet>
    </>
  );
}
