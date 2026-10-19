// The one file that names your production. Everything customer-facing that is
// specific to a show lives here or in season.config-style data (lib/season.ts,
// lib/resources.ts) — nothing else in the app should need editing to rebrand it.

export const SITE = {
  // Page title, share-preview title and the header title, per language.
  title: { en: "My Production 2026", ko: "My Production 2026" },
  description: "Rehearsal schedule & attendance",
  // Short name shown when the app is added to a phone's home screen.
  shortName: "Scheduler",
  // Prefix for everything the app remembers in the browser (language, theme,
  // folded groups…). Change it if you host more than one of these on one domain.
  storagePrefix: "sched",
  // Team tab names. The keys (actors / production / marketing) are stored in the
  // database and must not change; only the labels are yours to rename.
  departments: {
    actors: { en: "Cast", ko: "배우팀" },
    production: { en: "Creative", ko: "연출팀" },
    marketing: { en: "Operations", ko: "운영팀" },
  },
} as const;

export const storageKey = (name: string) => `${SITE.storagePrefix}${name}`;
