"use client";

import { usePreferences } from "@/lib/prefs";
import { t, teamLabel } from "@/lib/i18n";
import type { Team } from "@/lib/season";
import { Button, FieldLabel, Segmented, Sheet } from "@/components/ui";

const FONT_SAMPLE_CLASS: Record<string, string> = {
  normal: "text-sm",
  large: "text-base",
  xlarge: "text-lg",
};

export default function SettingsModal({
  open,
  onClose,
  showDepartment = true,
  teams = [],
}: {
  open: boolean;
  onClose: () => void;
  showDepartment?: boolean;
  teams?: Team[];
}) {
  const { prefs, setPrefs } = usePreferences();
  const l = (k: Parameters<typeof t>[1]) => t(prefs.lang, k);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={l("settings")}
      icon="gear"
      closeLabel={l("close")}
      footer={
        <Button className="w-full" onClick={onClose}>
          {l("close")}
        </Button>
      }
    >
      <div className="space-y-5">
        <div>
          <FieldLabel>{l("language")}</FieldLabel>
          <Segmented
            label={l("language")}
            value={prefs.lang}
            onChange={(v) => setPrefs({ lang: v })}
            options={[
              { value: "ko", label: "한국어" },
              { value: "en", label: "English" },
            ]}
          />
        </div>

        <div>
          <FieldLabel>{l("theme")}</FieldLabel>
          <Segmented
            label={l("theme")}
            value={prefs.theme}
            onChange={(v) => setPrefs({ theme: v })}
            options={[
              { value: "dark", label: l("dark"), icon: "moon" },
              { value: "light", label: l("light"), icon: "sun" },
            ]}
          />
        </div>

        <div>
          <FieldLabel>{l("fontSize")}</FieldLabel>
          <Segmented
            label={l("fontSize")}
            value={prefs.fontSize}
            onChange={(v) => setPrefs({ fontSize: v })}
            options={(["normal", "large", "xlarge"] as const).map((v) => ({
              value: v,
              label: <span className={`${FONT_SAMPLE_CLASS[v]} font-semibold leading-none`}>Aa</span>,
              sub: l(v),
            }))}
          />
        </div>

        {showDepartment && teams.length > 0 && (
          <div>
            <FieldLabel>{l("department")}</FieldLabel>
            <Segmented
              label={l("department")}
              value={prefs.department}
              onChange={(v) => setPrefs({ department: v })}
              options={teams.map((tm) => ({ value: tm.key, label: teamLabel(teams, tm.key, prefs.lang) }))}
            />
          </div>
        )}
        <a
          href="/admin"
          className="press flex items-center justify-between min-h-12 px-3.5 rounded-xl border border-zinc-700 bg-zinc-800/60 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
        >
          <span>{prefs.lang === "ko" ? "관리 페이지 (팀·멤버·일정)" : "Admin (teams, members, dates)"}</span>
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </Sheet>
  );
}
