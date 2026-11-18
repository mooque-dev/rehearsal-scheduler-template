# Hosting sites for other teams

For when you run the site for a group, so they never touch GitHub, Vercel or a database.
Each team gets its own Vercel project and its own Neon database on your account. Every
project builds from this repo's `main`, so one push updates every team at once.

## Set up a team (about two minutes)

You need Node and the Vercel CLI signed in to your account (`npx vercel whoami`). From this repo:

```bash
scripts/host-team.sh rehearsal-moonlight
```

The name becomes the address (`rehearsal-moonlight.vercel.app`). The script creates the
project, a free Neon database, a temporary admin password, deploys, and prints:

- the schedule link: goes to the whole team,
- the admin link and temporary password: go to the organiser only, privately.

The organiser is asked to change the password the first time they sign in to `/admin`. After
that only they know it. Then they set everything up on `/admin` (see
[GETTING-STARTED.ko.md](GETTING-STARTED.ko.md) step 2, or [GETTING-STARTED.md](GETTING-STARTED.md)).

## When the organiser forgets their password

Either one works:

- **Terminal, no redeploy.** Pull that site's settings and set a new temporary password:

  ```bash
  cd "$(mktemp -d)" && npx vercel link --yes --project rehearsal-moonlight && npx vercel env pull .env.local --environment production
  ```

  then, from this repo, `DATABASE_URL=… npm run set-admin-password` (the value is in that
  `.env.local`; delete the folder afterwards). It prints a new temporary password; the old
  one stops working at once.
- **Vercel dashboard.** Project → Settings → Environment Variables → change `ADMIN_PASSWORD`,
  then Deployments → ⋯ → Redeploy. The new value becomes the password again.

## Good to know

- **Your responsibility:** each team's names and absence reasons live in a database on your
  account. Tell organisers that up front.
- **Updates:** a push to `main` redeploys every team's site. CI runs first, but a broken push
  breaks everyone, so keep `main` green.
- **Plans:** Vercel's free Hobby plan is for non-commercial use; a paid company would need
  Vercel Pro. Check Neon's free-plan project limit before hosting many teams.
- **Removing a team:** delete the Vercel project and its Neon database
  (`npx vercel integration resource delete <name>-db`). That deletes their data for good.
