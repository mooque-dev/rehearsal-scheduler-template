"use client";

import { usePreferences } from "@/lib/prefs";
import { t, DEPARTMENTS, type DepartmentKey } from "@/lib/i18n";
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
  departmentLabels,
}: {
  open: boolean;
  onClose: () => void;
  showDepartment?: boolean;
  departmentLabels?: Partial<Record<DepartmentKey, string>>;
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

        {showDepartment && (
          <div>
            <FieldLabel>{l("department")}</FieldLabel>
            <Segmented
              label={l("department")}
              value={prefs.department}
              onChange={(v) => setPrefs({ department: v })}
              options={DEPARTMENTS.map((d) => ({ value: d, label: departmentLabels?.[d] ?? l(d) }))}
            />
          </div>
        )}
      </div>
    </Sheet>
  );
}
