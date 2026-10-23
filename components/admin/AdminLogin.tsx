"use client";

import Link from "next/link";
import { useState } from "react";
import { usePreferences } from "@/lib/prefs";
import { Button, Icon, Logo, inputClass } from "@/components/ui";

export default function AdminLogin({ enabled, demoHint }: { enabled: boolean; demoHint: string | null }) {
  const { prefs } = usePreferences();
  const ko = prefs.lang === "ko";
  const tx = (k: string, e: string) => (ko ? k : e);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) return window.location.reload();
    } catch {
      // treated like a wrong password: try again
    }
    setError(true);
    setAttempt((n) => n + 1);
    setLoading(false);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-950 px-4 py-8">
      <form onSubmit={submit} className="anim-pop w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <Logo className="mx-auto mb-4 w-20" />
          <h1 className="text-xl font-bold text-zinc-100">{tx("관리 페이지", "Admin")}</h1>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            {tx("팀, 멤버, 일정, 공지를 바꾸려면 관리자 비밀번호를 입력하세요.", "Enter the admin password to change teams, members, dates and notices.")}
          </p>
        </div>
        {!enabled ? (
          <p className="text-sm text-amber-300 bg-amber-500/10 rounded-xl px-4 py-3 leading-relaxed">
            {tx("ADMIN_PASSWORD 환경 변수가 설정되지 않아 관리 페이지가 꺼져 있어요.", "The admin page is off: set the ADMIN_PASSWORD environment variable to turn it on.")}
          </p>
        ) : (
          <>
            {demoHint && (
              <p className="mb-4 text-sm text-zinc-300 bg-zinc-800/70 rounded-xl px-4 py-3">
                {tx("데모 비밀번호", "Demo password")}: <code className="font-mono font-semibold text-zinc-100">{demoHint}</code>
              </p>
            )}
            <input
              key={attempt}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder={tx("비밀번호", "Password")}
              aria-label={tx("비밀번호", "Password")}
              aria-invalid={error}
              autoComplete="current-password"
              autoFocus
              className={`${inputClass} ${error ? "anim-shake border-red-400" : ""}`}
            />
            <p role="alert" className={`text-sm text-red-400 mt-2 flex items-center gap-1.5 ${error ? "" : "invisible"}`}>
              <Icon name="alert" className="w-4 h-4" />
              {tx("비밀번호가 맞지 않아요.", "That password isn't right.")}
            </p>
            <Button type="submit" variant="primary" className="w-full mt-3" disabled={!password || loading}>
              {loading ? tx("확인 중…", "Checking…") : tx("들어가기", "Sign in")}
            </Button>
          </>
        )}
        <Link href="/" className="block text-center text-sm text-zinc-400 hover:text-zinc-200 mt-5">
          ← {tx("일정표로 돌아가기", "Back to the schedule")}
        </Link>
      </form>
    </div>
  );
}
