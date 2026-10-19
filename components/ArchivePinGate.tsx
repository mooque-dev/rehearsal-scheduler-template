"use client";

import { useState } from "react";
import { Button, Icon, Logo, inputClass, type IconName } from "@/components/ui";

export default function ArchivePinGate({
  icon = "archive",
  titleKo = "시즌 1 아카이브",
  titleEn = "Season 1 Archive",
}: {
  icon?: IconName;
  titleKo?: string;
  titleEn?: string;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  // bumps on every wrong attempt so the field shakes again each time
  const [attempt, setAttempt] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/archive/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
    } catch {
      // network failure reads the same as a wrong passphrase: try again
    }
    setError(true);
    setAttempt((n) => n + 1);
    setLoading(false);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-950 px-4 py-8">
      <form
        onSubmit={submit}
        className="anim-pop w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8"
      >
        <div className="text-center mb-6">
          <div className="relative mx-auto mb-4 w-20">
            <Logo className="w-20" />
            <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center">
              <Icon name={icon} className="w-3.5 h-3.5" />
            </span>
          </div>
          <h1 className="text-xl font-bold text-zinc-100">{titleKo}</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{titleEn}</p>
          <p className="text-sm text-zinc-400 mt-4 leading-relaxed">
            아카이브 비밀번호를 입력하세요
            <br />
            <span className="text-zinc-500">Enter the archive passphrase</span>
          </p>
        </div>
        <input
          key={attempt}
          type="password"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          placeholder="비밀번호 · Passphrase"
          aria-label="비밀번호 · Passphrase"
          aria-invalid={error}
          aria-describedby={error ? "pin-error" : undefined}
          autoComplete="current-password"
          autoFocus
          className={`${inputClass} ${error ? "anim-shake border-red-400 focus:border-red-400 focus:ring-red-400/25" : ""}`}
        />
        <p
          id="pin-error"
          role="alert"
          className={`text-sm text-red-400 mt-2 flex items-center gap-1.5 transition-opacity ${error ? "opacity-100" : "opacity-0"}`}
        >
          <Icon name="alert" className="w-4 h-4 shrink-0" />
          비밀번호가 올바르지 않습니다 · Incorrect passphrase
        </p>
        <Button type="submit" variant="primary" disabled={!pin || loading} className="w-full mt-3 min-h-12">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              잠금 해제 · Unlock
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Icon name="lock" className="w-4 h-4" />
              잠금 해제 · Unlock
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
