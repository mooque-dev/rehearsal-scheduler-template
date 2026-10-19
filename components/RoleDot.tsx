"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { t, ROLES, ROLE_DOT_COLOR, ROLE_RING_COLOR, type Lang } from "@/lib/i18n";
import { Icon } from "@/components/ui";

const MENU_WIDTH = 168;

export default function RoleDot({
  role,
  pending = false,
  personId,
  personName,
  onRoleChange,
  lang,
}: {
  role: string | null;
  pending?: boolean;
  personId: number;
  personName?: string;
  onRoleChange: (personId: number, role: string | null) => void;
  lang: Lang;
}) {
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const open = pos !== null;
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const l = (k: Parameters<typeof t>[1]) => t(lang, k);

  const close = (refocus = false) => {
    setPos(null);
    if (refocus) btnRef.current?.focus();
  };

  // The menu renders into <body> at a fixed position. It used to be an
  // absolute child of the sticky name cell, where the cell's overflow clipping
  // hid all but its top edge — the role picker was effectively invisible.
  const toggle = () => {
    if (open) return close();
    const r = btnRef.current!.getBoundingClientRect();
    const menuH = (ROLES.length + 1) * 44 + 12;
    const up = r.bottom + menuH + 8 > window.innerHeight && r.top - menuH - 8 > 0;
    setPos({
      top: up ? r.top - 4 : r.bottom + 4,
      left: Math.min(Math.max(8, r.left), window.innerWidth - MENU_WIDTH - 8),
      up,
    });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || btnRef.current?.contains(target)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(true);
      }
    };
    // a fixed menu would drift away from its row if the table scrolled under it
    const onScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      close();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  // move focus into the menu so keyboard users land on the current choice
  useLayoutEffect(() => {
    if (!open) return;
    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitemradio]");
    const current = Array.from(items ?? []).find((b) => b.getAttribute("aria-checked") === "true");
    (current ?? items?.[0])?.focus();
  }, [open]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitemradio]") ?? []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = (i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  };

  const choose = (r: string | null) => {
    onRoleChange(personId, r);
    close(true);
  };

  const dotClass = role ? ROLE_DOT_COLOR[role] : "bg-zinc-600";
  const ringClass = role ? ROLE_RING_COLOR[role] : "ring-zinc-500/40";
  const roleLabel = role ? l(role as Parameters<typeof t>[1]) : l("Unassigned");
  const options: (string | null)[] = [...ROLES, null];

  return (
    <>
      {/* 28×36px hit area around a 10px dot — the dot alone was 8px, well under
          anything a thumb can reliably hit */}
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${personName ? personName + " — " : ""}${roleLabel}`}
        title={roleLabel}
        className={`group/dot shrink-0 w-7 h-9 sm:w-8 sm:h-8 -my-1 flex items-center justify-center rounded-lg transition-colors hover:bg-zinc-800 ${
          open ? "bg-zinc-800" : ""
        }`}
      >
        <span
          className={`w-2.5 h-2.5 rounded-full ${dotClass} ring-2 ${ringClass} transition-transform group-hover/dot:scale-125 group-active/dot:scale-90 ${
            pending ? "outline-2 outline-offset-2 outline-dashed outline-blue-400" : ""
          }`}
        />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={personName ?? roleLabel}
            onKeyDown={onMenuKey}
            style={{
              position: "fixed",
              left: pos.left,
              width: MENU_WIDTH,
              ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
            }}
            className="anim-pop z-[80] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/40 p-1.5"
          >
            {personName && (
              <div className="px-2.5 pt-1 pb-1.5 text-xs font-semibold text-zinc-400 truncate">{personName}</div>
            )}
            {options.map((r) => {
              const on = role === r;
              return (
                <button
                  key={r ?? "_none"}
                  type="button"
                  role="menuitemradio"
                  aria-checked={on}
                  onClick={() => choose(r)}
                  className={`w-full min-h-11 sm:min-h-9 px-2.5 rounded-lg text-left text-sm flex items-center gap-2.5 transition-colors hover:bg-zinc-800 active:bg-zinc-700 ${
                    on ? "text-zinc-100 font-medium" : "text-zinc-300"
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r ? ROLE_DOT_COLOR[r] : "bg-zinc-600"}`} />
                  <span className="flex-1">{r ? l(r as Parameters<typeof t>[1]) : l("none")}</span>
                  {on && <Icon name="check" className="w-4 h-4 text-blue-400" />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
