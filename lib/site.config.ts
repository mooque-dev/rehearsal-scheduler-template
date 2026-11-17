// Fallbacks used before anything is set on /admin (the name shown there wins),
// plus the browser-storage prefix. Teams, members and dates are edited on /admin.

export const SITE = {
  // Default name, and the title of the browser tab and share preview.
  title: { en: "My Production", ko: "My Production" },
  description: "Rehearsal schedule & attendance",
  // Short name shown when the app is added to a phone's home screen.
  shortName: "Scheduler",
  // Prefix for everything the app remembers in the browser (language, theme,
  // folded groups…). Change it if you host more than one of these on one domain.
  storagePrefix: "sched",
  // The project page, and the one-click "make your own copy" link (Vercel copies the
  // repository, creates a free Neon database and asks for the admin password).
  templateUrl: "https://github.com/mooque-dev/rehearsal-scheduler-template#readme",
  deployUrl:
    "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmooque-dev%2Frehearsal-scheduler-template&project-name=rehearsal-scheduler&repository-name=rehearsal-scheduler&env=ADMIN_PASSWORD&envDescription=%EA%B4%80%EB%A6%AC%20%ED%8E%98%EC%9D%B4%EC%A7%80%20%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8%20%C2%B7%20Password%20for%20your%20%2Fadmin%20page.%20Choose%20a%20long%20one%20and%20keep%20it%20private.&envLink=https%3A%2F%2Fgithub.com%2Fmooque-dev%2Frehearsal-scheduler-template%23get-your-own-about-10-minutes-no-coding&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D",
  guideUrl: {
    en: "https://github.com/mooque-dev/rehearsal-scheduler-template/blob/main/docs/GETTING-STARTED.md",
    ko: "https://github.com/mooque-dev/rehearsal-scheduler-template/blob/main/docs/GETTING-STARTED.ko.md",
  },
} as const;

export const storageKey = (name: string) => `${SITE.storagePrefix}${name}`;
