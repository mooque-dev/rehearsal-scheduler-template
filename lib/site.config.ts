// Fallbacks used before anything is set on /admin (the name shown there wins),
// plus the browser-storage prefix. Teams, members and dates are edited on /admin.

export const SITE = {
  // Default name, and the title of the browser tab and share preview.
  title: { en: "My Production 2026", ko: "My Production 2026" },
  description: "Rehearsal schedule & attendance",
  // Short name shown when the app is added to a phone's home screen.
  shortName: "Scheduler",
  // Prefix for everything the app remembers in the browser (language, theme,
  // folded groups…). Change it if you host more than one of these on one domain.
  storagePrefix: "sched",
  // Where the public demo's banner sends people who want their own copy.
  templateUrl: "https://github.com/mooque-dev/rehearsal-scheduler-template#readme",
} as const;

export const storageKey = (name: string) => `${SITE.storagePrefix}${name}`;
