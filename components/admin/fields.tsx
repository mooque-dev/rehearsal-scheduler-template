"use client";

// Small form controls for the admin page, built on the app's input styles.
import { useEffect, useId, useState, type ReactNode } from "react";
import { FieldLabel, Icon, inputClass } from "@/components/ui";

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
  autoFocus,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "date";
  placeholder?: string;
  hint?: string;
  autoFocus?: boolean;
  multiline?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className={`${inputClass} py-3 leading-relaxed`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={inputClass}
        />
      )}
      {hint && <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">{hint}</p>}
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const id = useId();
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={`${inputClass} appearance-none pr-10`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          name="chevronDown"
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
        />
      </div>
    </div>
  );
}

/** A labelled on/off switch row. */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full min-h-12 flex items-center justify-between gap-3 text-left rounded-xl px-3.5 py-2.5 bg-zinc-800/60 border border-zinc-700/60 hover:bg-zinc-800"
    >
      <span>
        <span className="block text-sm font-medium text-zinc-100">{label}</span>
        {hint && <span className="block text-xs text-zinc-400 mt-0.5">{hint}</span>}
      </span>
      <span
        aria-hidden="true"
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-zinc-600"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[1.375rem]" : "translate-x-0.5"}`}
        />
      </span>
    </button>
  );
}

/** Pick any number of chips; none picked means "all". */
export function ChipPicker({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
              className={`press min-h-10 px-3.5 rounded-full text-sm font-medium border ${
                on ? "bg-blue-600 text-white border-blue-500" : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

/** Delete needs a second tap, so a stray tap never removes anything. */
export function DeleteButton({
  label,
  confirmLabel,
  onConfirm,
  disabled,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      className={`press min-h-11 px-4 rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${
        armed ? "bg-red-600 text-white" : "bg-zinc-800 text-red-400 hover:bg-zinc-700"
      }`}
    >
      {armed ? confirmLabel : label}
    </button>
  );
}

/** A tappable list row with a title, a muted line and optional trailing pieces. */
export function Row({
  title,
  sub,
  badges,
  onClick,
  trailing,
}: {
  title: ReactNode;
  sub?: ReactNode;
  badges?: ReactNode;
  onClick?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 last:border-b-0">
      <button type="button" onClick={onClick} className="flex-1 min-w-0 min-h-11 text-left rounded-lg -mx-1 px-1 hover:bg-zinc-800/50">
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-zinc-100 truncate">{title}</span>
          {badges}
        </span>
        {sub && <span className="block text-xs text-zinc-400 mt-0.5 truncate">{sub}</span>}
      </button>
      {trailing}
    </li>
  );
}

export function Badge({ children, tone = "zinc" }: { children: ReactNode; tone?: "zinc" | "amber" | "violet" | "blue" | "emerald" }) {
  const tones = {
    zinc: "bg-zinc-800 text-zinc-300",
    amber: "bg-amber-500/15 text-amber-300",
    violet: "bg-violet-500/20 text-violet-300",
    blue: "bg-blue-500/15 text-blue-300",
    emerald: "bg-emerald-500/15 text-emerald-300",
  }[tone];
  return <span className={`text-[0.6875rem] font-semibold px-1.5 py-0.5 rounded-md ${tones}`}>{children}</span>;
}

export function MoveButtons({ onUp, onDown, labelUp, labelDown }: { onUp: () => void; onDown: () => void; labelUp: string; labelDown: string }) {
  return (
    <span className="flex shrink-0">
      <button type="button" onClick={onUp} aria-label={labelUp} className="press w-10 h-11 grid place-items-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
        <Icon name="chevronDown" className="w-4 h-4 rotate-180" />
      </button>
      <button type="button" onClick={onDown} aria-label={labelDown} className="press w-10 h-11 grid place-items-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
        <Icon name="chevronDown" className="w-4 h-4" />
      </button>
    </span>
  );
}
