# Rehearsal Scheduler

A mobile-first attendance and schedule app for a theatre company or any group that rehearses
on a calendar: a shared table per team, ✓ / ✕ / – for every date, a reason when someone can't
come, notices, a calendar, an update log that records who changed what (with admin-gated
revert), and a read-only archive of earlier seasons. English and Korean out of the box,
light and dark themes, works on a phone.

It is a plain Next.js app with a Postgres database — no accounts, no ORM, a handful of dependencies.

> **This repository is a template.** It contains a fictional company ("My Production") so you
> can see it working. Nothing in it belongs to a real group.

## Quick start (about 15 minutes)

You need Node 22.18+, a free [Neon](https://neon.com) (or any Postgres) database, and a free
[Vercel](https://vercel.com) account for hosting.

1. **Use this template.** On GitHub press **Use this template → Create a new repository**
   (or `gh repo create my-show --template <owner>/<this-repo> --private --clone`).
2. **Create a database** and copy its connection string.
3. **Configure the environment.**
   ```bash
   npm install
   cp .env.example .env.local     # then fill in DATABASE_URL, ADMIN_PASSWORD, ARCHIVE_PIN
   ```
4. **Load the sample company** (creates the tables; adds 3 teams, 18 fictional people, a season of dates and 3 notices):
   ```bash
   npm run seed
   npm run dev                    # http://localhost:3000
   ```
5. **Deploy.** Import the repo into Vercel, add the same environment variables, deploy. Every
   push to `main` redeploys. Then open `/admin` on your site to set up your own company.

When you are ready for real data, delete the sample people, dates and notices on /admin (or run
`npm run seed -- --reset` and edit from there), then add your own. Skipping the seed entirely also works:
an empty database shows a link to /admin.

## Make it yours — on /admin, no code

Open **/admin** (or Settings → Admin) and sign in with `ADMIN_PASSWORD`. From there you can:

| Tab | What you can change |
| --- | --- |
| **Members** | Add, edit, reorder and remove people; pick their team, role (leads / ensemble / coach), A/B cast, a second group, a character or position |
| **Teams** | Add, rename (English and Korean), reorder and remove teams; "group by role" splits a team into leads, ensemble and coaches |
| **Schedule** | Add repeating dates (every week or every 2 weeks on a chosen day, between two dates, skipping breaks), add or edit single dates (what, time, venue, performance, special session, everyone-attends ★, which teams/roles attend), breaks, venues |
| **Notices** | Add, edit and remove notices (Markdown-style links: `[Map](https://…)`) |
| **General** | The name shown on the schedule, and whether unanswered cells mean "–" or "✓"; on a demo, "Reset demo" |

Moving a date keeps the answers already given; deleting a date or a member removes their answers.

Still in code (rarely changes): links in the Resources panel (`lib/resources.ts`), the logo (`lib/logoPaths.ts`
plus the four image files in `app/`), wording (`lib/i18n.ts`) and colours (`app/globals.css`). To replace the logo,
copy each `<path d="…">` from your SVG into `lib/logoPaths.ts` (viewBox `0 0 217 141`) and replace `app/icon.svg`,
`app/icon.png` (512×512), `app/apple-icon.png` (180×180) and `app/opengraph-image.png` (1200×630).

**Running a public demo?** Set `DEMO_MODE=1`: the admin password is shown on the sign-in screen so visitors can try
everything, and General gets a "Reset demo" button.

## How attendance works

Each cell is **–** (not selected), **✓** or **✕**. Only answers are stored (`absences` table);
a missing row means the season's default (`defaultStatus` in `lib/season.ts`). Marking ✕
requires a reason. Every save writes an entry to the Update Log with the previous values, and
an admin can revert it with `ADMIN_PASSWORD`.

Anyone with the link can edit anyone's attendance — that keeps it frictionless for a small
company, and the log plus revert is the safety net. If you need more control, put the site
behind your host's password protection or add authentication before the first real season.

## Seasons and the archive

Everything on /admin belongs to the current season (`_meta.current_season`, default 1). To start
season 2, set that value to `2` in the database and build the new season on /admin; season 1 stays
readable at `/archive` behind `ARCHIVE_PIN`.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run seed` | Create tables and load the sample company (`-- --reset` to start over) |

## Notes

- Built on Next.js 16 (App Router), React 19, Tailwind v4, TypeScript and `pg`.
- `AGENTS.md` / `CLAUDE.md` are hints for AI coding assistants; keep or delete them.
- No license is included. Add one (for example MIT) before you share the code more widely.
