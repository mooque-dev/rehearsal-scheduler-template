"use client";

import type { Lang } from "@/lib/i18n";

export default function DDayCounter({ lang, showStart }: { lang: Lang; showStart: string | null }) {
  if (!showStart) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const show = new Date(showStart);
  const days = Math.ceil((show.getTime() - now.getTime()) / 86400000);
  if (days <= 0) return null;

  const months = Math.max(
    0,
    (show.getFullYear() - now.getFullYear()) * 12 +
      show.getMonth() -
      now.getMonth() -
      (now.getDate() > show.getDate() ? 1 : 0)
  );
  const monthMark = new Date(now);
  monthMark.setMonth(monthMark.getMonth() + months);
  const remainderDays = Math.ceil((show.getTime() - monthMark.getTime()) / 86400000);

  const breakdown =
    months === 0
      ? lang === "ko"
        ? `${days}일`
        : `${days} days`
      : lang === "ko"
        ? `${months}개월 ${remainderDays}일`
        : `${months}mo ${remainderDays}d`;

  return (
    <span className="inline-flex items-baseline gap-1.5 text-sm sm:text-base">
      <span className="font-bold text-amber-400">D-{days}</span>
      <span className="hidden sm:inline text-xs text-zinc-400">({breakdown})</span>
    </span>
  );
}
