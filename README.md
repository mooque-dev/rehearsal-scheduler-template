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
   cp .env.example .env.local     # then fill in DATABASE_URL, ARCHIVE_PIN, REVERT_PASSWORD
   ```
4. **Load the sample company** (creates the tables, adds 18 fictional people and 3 notices):
   ```bash
   npm run seed
   npm run dev                    # http://localhost:3000
   ```
5. **Deploy.** Import the repo into Vercel, add the same three environment variables,
   deploy. Every push to `main` redeploys.

When you are ready for real data: `npm run seed -- --reset` clears the sample people, notices and
attendance (it asks for nothing, so only run it on a database you can lose), then add your own.

## Make it yours

Everything that names your group lives in a few files — nothing else needs editing.

| What | Where |
| --- | --- |
| Show name, team tab names, browser-storage prefix | `lib/site.config.ts` |
| Rehearsal dates, hours, venues, breaks, special sessions, performance dates | `lib/season.ts` |
| Links and standing info in the Resources panel | `lib/resources.ts` |
| Logo (drawn as SVG paths) | `lib/logoPaths.ts`, then regenerate the icons below |
| Icons and share preview | `app/icon.svg`, `app/icon.png`, `app/apple-icon.png`, `app/opengraph-image.png` |
| Wording, in English and Korean | `lib/i18n.ts` |
| Colours and themes | `app/globals.css` |

**Logo and icons.** Copy each `<path d="…">` from your SVG into `lib/logoPaths.ts` (viewBox
`0 0 217 141` is assumed; adjust `viewBox` in `components/ui.tsx` for another ratio). Replace the
four image files in `app/` with your own at the same sizes (512×512, 512×512, 180×180, 1200×630).

**People.** Stored in the `people` table: `name`, `department` (`actors`, `production` or
`marketing` — shown under the labels in `site.config.ts`), `role` (`Main/Sub`, `Ensemble`,
`Coach`, or empty), `team` (`A`/`B`), `character_name` (for coaches, `spec:music`, `spec:vocal`
or `spec:acting`), `also_role` (a second group, shown as a small badge) and `sort_order`. Edit
rows in the Neon console or a SQL client; `scripts/seed.mjs` shows the shape. There is no admin
screen yet.

**Notices.** Rows in the `notices` table (`title`, `content`, `notice_date`, `time_info`).
`content` supports Markdown-style links: `[Map](https://…)`.

## How attendance works

Each cell is **–** (not selected), **✓** or **✕**. Only answers are stored (`absences` table);
a missing row means the season's default (`defaultStatus` in `lib/season.ts`). Marking ✕
requires a reason. Every save writes an entry to the Update Log with the previous values, and
an admin can revert it with `REVERT_PASSWORD`.

Anyone with the link can edit anyone's attendance — that keeps it frictionless for a small
company, and the log plus revert is the safety net. If you need more control, put the site
behind your host's password protection or add authentication before the first real season.

## Seasons and the archive

A season's dates live in `lib/season.ts`; its people, notices and attendance live in the
database under a `season` number. To start season 2: copy the season-1 builder to `2`, add
season-2 people (`season = 2`), and set the database value `_meta.current_season` to `2`.
Season 1 then appears read-only at `/archive` behind `ARCHIVE_PIN`.

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
