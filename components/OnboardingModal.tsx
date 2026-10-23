"use client";

import { useState } from "react";
import { usePreferences } from "@/lib/prefs";
import { STRINGS, teamLabel, type Lang } from "@/lib/i18n";
import type { Team } from "@/lib/season";
import { Button, FieldLabel, Logo, Segmented, Sheet } from "@/components/ui";

export default function OnboardingModal({ teams }: { teams: Team[] }) {
  const { prefs, setPrefs, ready } = usePreferences();
  const [lang, setLang] = useState<Lang>(prefs.lang);
  const [theme, setTheme] = useState(prefs.theme);
  const [department, setDepartment] = useState(prefs.department);
  const choice = teams.some((tm) => tm.key === department) ? department : (teams[0]?.key ?? department);

  if (!ready || prefs.onboarded) return null;
  const r = STRINGS[lang];

  // preview the theme on the page behind the sheet as soon as it's picked
  function pickTheme(v: "dark" | "light") {
    setTheme(v);
    document.documentElement.dataset.theme = v;
  }

  return (
    <Sheet open dismissable={false} centered z="z-[100]">
      <div className="text-center mb-6">
        <Logo className="mx-auto mb-3 w-20" />
        <h2 className="text-xl font-bold text-zinc-100">{r.welcomeTitle}</h2>
        <p className="text-sm text-zinc-400 mt-1">{r.welcomeSub}</p>
      </div>

      <div className="space-y-5">
        <div>
          <FieldLabel>{r.language}</FieldLabel>
          <Segmented
            label={r.language}
            value={lang}
            onChange={setLang}
            options={[
              { value: "ko", label: "한국어" },
              { value: "en", label: "English" },
            ]}
          />
        </div>
        <div>
          <FieldLabel>{r.theme}</FieldLabel>
          <Segmented
            label={r.theme}
            value={theme}
            onChange={pickTheme}
            options={[
              { value: "dark", label: r.dark, icon: "moon" },
              { value: "light", label: r.light, icon: "sun" },
            ]}
          />
        </div>
        {teams.length > 0 && <div>
          <FieldLabel>{r.department}</FieldLabel>
          <Segmented
            label={r.department}
            value={choice}
            onChange={setDepartment}
            options={teams.map((tm) => ({ value: tm.key, label: teamLabel(teams, tm.key, lang) }))}
          />
        </div>}
      </div>

      <Button
        variant="primary"
        className="w-full mt-6 min-h-12"
        onClick={() => setPrefs({ lang, theme, department: choice, onboarded: true })}
      >
        {r.continue}
      </Button>
    </Sheet>
  );
}
