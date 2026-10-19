"use client";

import { useState } from "react";
import { t, ABSENCE_REASON_PRESETS, type Lang } from "@/lib/i18n";
import type { Person } from "@/lib/types";
import { ALWAYS_LISTED_SAVERS } from "@/lib/savers";
import { Button, FieldLabel, Icon, Segmented, Sheet, inputClass } from "@/components/ui";

export default function WhoSavingModal({
  open,
  onClose,
  onSave,
  people,
  saving,
  lang,
  requireReason,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, reason?: string) => void;
  people: Person[];
  saving: boolean;
  lang: Lang;
  requireReason: boolean;
}) {
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");
  const [reasonChoice, setReasonChoice] = useState("");
  const [reasonCustom, setReasonCustom] = useState("");
  const l = (k: Parameters<typeof t>[1]) => t(lang, k);
  const name = selected === "__custom" ? custom.trim() : selected;
  const reason =
    reasonChoice === "__custom" ? reasonCustom.trim() : reasonChoice ? l(reasonChoice as Parameters<typeof t>[1]) : "";
  const canSave = !!name && (!requireReason || !!reason);
  // Savers who belong to another department's roster but edit from any tab.
  const names = [...new Set([...people.map((p) => p.name), ...ALWAYS_LISTED_SAVERS])].sort((a, b) =>
    a.localeCompare(b, lang === "ko" ? "ko" : "en")
  );

  function reset() {
    setSelected("");
    setCustom("");
    setReasonChoice("");
    setReasonCustom("");
  }

  function cancel() {
    reset();
    onClose();
  }

  // No reset here: if the save fails the sheet stays open with the name and
  // reason still filled in (it used to wipe them). The parent remounts this
  // component each time the sheet opens, which is what clears it.
  function submit() {
    if (!canSave || saving) return;
    onSave(name, requireReason ? reason : undefined);
  }

  return (
    <Sheet
      open={open}
      onClose={cancel}
      dismissable={!saving}
      title={l("whoSaving")}
      icon="user"
      closeLabel={l("close")}
      footer={
        <div className="flex gap-2">
          <Button className="flex-1" onClick={cancel} disabled={saving}>
            {l("cancel")}
          </Button>
          <Button variant="primary" className="flex-1" onClick={submit} disabled={!canSave || saving}>
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {l("saving")}
              </span>
            ) : (
              l("saveChanges")
            )}
          </Button>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{l("whoSavingDesc")}</p>
        {/* Native select on purpose: on a phone it opens the OS picker, which
            beats any custom list for a 30-name roster. */}
        <div className="relative">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            aria-label={l("selectName")}
            className={`${inputClass} appearance-none pr-10 ${selected ? "" : "text-zinc-400"}`}
          >
            <option value="">{l("selectName")}</option>
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value="__custom">{l("otherName")}</option>
          </select>
          <Icon
            name="chevronDown"
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
          />
        </div>
        {selected === "__custom" && (
          <input
            type="text"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={l("enterName")}
            aria-label={l("enterName")}
            autoComplete="name"
            className={`${inputClass} anim-fade mt-3`}
            autoFocus
          />
        )}

        {requireReason && (
          <div className="mt-5 pt-5 border-t border-zinc-800">
            <FieldLabel>{l("reasonPrompt")}</FieldLabel>
            <p className="text-sm text-zinc-400 mb-3 -mt-1 leading-relaxed">{l("reasonDesc")}</p>
            <Segmented
              label={l("reasonPrompt")}
              columns={2}
              value={reasonChoice}
              onChange={setReasonChoice}
              options={[
                ...ABSENCE_REASON_PRESETS.map((k) => ({ value: k as string, label: l(k as Parameters<typeof t>[1]) })),
              ]}
            />
            <button
              type="button"
              aria-pressed={reasonChoice === "__custom"}
              onClick={() => setReasonChoice("__custom")}
              className={`press mt-2 w-full min-h-11 rounded-xl text-sm font-medium border ${
                reasonChoice === "__custom"
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700/60 hover:bg-zinc-700 hover:text-zinc-100"
              }`}
            >
              {l("reasonOther")}
            </button>
            {reasonChoice === "__custom" && (
              <input
                type="text"
                value={reasonCustom}
                onChange={(e) => setReasonCustom(e.target.value)}
                placeholder={l("enterReason")}
                aria-label={l("enterReason")}
                className={`${inputClass} anim-fade mt-3`}
                autoFocus
              />
            )}
          </div>
        )}
        {/* lets Enter in a text field submit */}
        <button type="submit" hidden />
      </form>
    </Sheet>
  );
}
