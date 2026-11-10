# Getting started — no coding needed

This sets up your own copy of the scheduler: your link, your people, your look. It takes about ten minutes and
everything happens in a web browser. It's free.

You'll make two free accounts along the way (or use ones you have):

- **GitHub** keeps your copy of the app. → https://github.com/signup
- **Vercel** puts it on the internet at a link you can share. → sign in with your GitHub account when asked.

Want to look first? The demo is at https://rehearsal-scheduler-demo.vercel.app (admin password `demo-admin`).

## 1. Create your copy

1. Open **[this link](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmooque-dev%2Frehearsal-scheduler-template&project-name=rehearsal-scheduler&repository-name=rehearsal-scheduler&env=ADMIN_PASSWORD&envDescription=The%20password%20for%20your%20%2Fadmin%20page.%20Choose%20a%20long%20one%20and%20keep%20it%20private.&envLink=https%3A%2F%2Fgithub.com%2Fmooque-dev%2Frehearsal-scheduler-template%2Fblob%2Fmain%2Fdocs%2FGETTING-STARTED.md&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)** (it's the "Deploy with Vercel" button from the front page).
2. Sign in to Vercel with GitHub if it asks.
3. **Create Git Repository:** leave the name as it is (or type your group's name, no spaces), keep **Private** ticked,
   press **Create**.
4. **Add Products / Storage:** Vercel offers to create a **Neon** database. Accept the free plan and continue. (Neon
   may ask you to accept its terms once.)
5. **Environment Variables:** type an **ADMIN_PASSWORD**. Make it long (a short sentence works well) and save it
   somewhere safe: it's the key to your admin page.
6. Press **Deploy** and wait about a minute. You'll land on a "Congratulations" page with your link, something like
   `rehearsal-scheduler-yourname.vercel.app`.

**If step 4 didn't appear** (no database was offered): finish the deploy anyway, then in your new Vercel project open
**Storage → Create Database → Neon**, accept the free plan, and connect it to the project. Then open **Deployments**,
press **⋯** on the newest one and choose **Redeploy**.

## 2. Set up your group

1. Open `your-link/admin` and sign in with your admin password.
2. Choose **Load the sample** to look around a made-up company first, or **Start empty**.
3. **Teams:** add one tab per group (for example Cast, Creative, Operations). Turn on "Group by role" for a cast.
4. **Members:** add people to each team.
5. **Schedule:** press **Add repeating dates**, pick the day, the first and last date, the time and the place. Add
   one-off dates, breaks and performances the same way.
6. **Branding:** pick a look, upload your logo, choose your colour. Press **Publish brand**.
7. **General:** type your group's name.

If you loaded the sample, delete the sample people and dates as you go (open one, press Delete twice).

## 3. Share it

Send your link (without `/admin`) to your group. Each person:

1. Opens the link and picks their language and team.
2. Taps their dates: **✓** coming, **✕** can't come, **–** not answered yet.
3. Presses **Save**, picks their name, and gives a reason if they marked ✕.

On a phone, "Add to Home Screen" from the browser's share menu makes it open like an app.

## Looking after it

- **See who's coming:** press **Attendance** on the schedule, then **By date**.
- **Undo a mistake:** open the Update Log at the bottom of the schedule, press **Revert** on the entry and enter your
  admin password.
- **Change anything later:** everything in step 2 can be edited any time on `/admin`.
- **Forgot the admin password?** In Vercel open your project → **Settings → Environment Variables**, edit
  `ADMIN_PASSWORD`, then redeploy (Deployments → ⋯ → Redeploy).
- **Keep it private:** anyone with the link can mark attendance, so share it only with your group. Never share the
  admin password or post it in a group chat.
- **Updates:** your copy is yours and doesn't change by itself. To pick up improvements later, ask whoever shared
  this with you, or see the project page: https://github.com/mooque-dev/rehearsal-scheduler-template

## Words you'll see

- **Repository (repo):** your copy of the app's files on GitHub.
- **Deploy:** putting the latest version of your copy online. Vercel does it automatically.
- **Environment variable:** a private setting (like your admin password) stored in Vercel, never in the files.
- **Database:** where your people, dates and answers are kept (Neon). The app's files hold none of it.
