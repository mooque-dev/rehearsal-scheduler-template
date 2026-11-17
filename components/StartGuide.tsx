"use client";

// "Make your own copy" — the page the demo's banner links to. Everything happens in a
// browser; no terminal. Follows the app's language setting (and can switch it).
import Link from "next/link";
import type { ReactNode } from "react";
import { usePreferences } from "@/lib/prefs";
import { SITE } from "@/lib/site.config";
import { Icon, LoadingScreen, Segmented } from "@/components/ui";

type L = { ko: ReactNode; en: ReactNode };

/** Vercel's and GitHub's screens are in English, so their labels stay in English in both languages. */
function UI({ children }: { children: ReactNode }) {
  return <span className="font-semibold text-zinc-100 whitespace-nowrap">“{children}”</span>;
}

const STEPS: { title: L; body: L[] }[] = [
  {
    title: { ko: "내 복사본 만들기 (약 5분)", en: "Create your copy (about 5 minutes)" },
    body: [
      {
        ko: <>위의 <UI>Deploy</UI> 버튼을 누르고, GitHub 계정으로 Vercel에 로그인해요.</>,
        en: <>Press the <UI>Deploy</UI> button above and sign in to Vercel with your GitHub account.</>,
      },
      {
        ko: <>저장소 이름은 그대로 두거나 팀 이름으로 바꿔요(띄어쓰기 없이). <UI>Private</UI>을 켜 두세요.</>,
        en: <>Keep the repository name or use your group&apos;s (no spaces). Leave <UI>Private</UI> on.</>,
      },
      {
        ko: <>데이터베이스 단계에서 <UI>Neon</UI>의 무료 플랜을 선택해요. 약관 동의를 한 번 물어볼 수 있어요.</>,
        en: <>At the database step, choose <UI>Neon</UI>&apos;s free plan. It may ask you to accept its terms once.</>,
      },
      {
        ko: <><UI>ADMIN_PASSWORD</UI> 칸에 관리 페이지 비밀번호를 정해서 넣어요. 길게(짧은 문장도 좋아요), 그리고 안전한 곳에 적어 두세요.</>,
        en: <>Type a password for your admin page into <UI>ADMIN_PASSWORD</UI>. Make it long (a short sentence works) and keep it somewhere safe.</>,
      },
      {
        ko: <><UI>Deploy</UI>를 누르고 1분쯤 기다리면 내 주소(예: <code>rehearsal-scheduler-abc.vercel.app</code>)가 나와요.</>,
        en: <>Press <UI>Deploy</UI> and wait about a minute. You&apos;ll get your own address, like <code>rehearsal-scheduler-abc.vercel.app</code>.</>,
      },
    ],
  },
  {
    title: { ko: "우리 팀으로 채우기", en: "Set it up for your group" },
    body: [
      {
        ko: <>내 주소 뒤에 <code>/admin</code>을 붙여 열고, 정한 비밀번호로 로그인해요.</>,
        en: <>Open your address with <code>/admin</code> on the end and sign in with your password.</>,
      },
      {
        ko: <>둘러보고 싶으면 <b>예시 불러오기</b>, 바로 시작하려면 <b>빈 상태로 시작</b>을 눌러요.</>,
        en: <>Choose <b>Load the sample</b> to look around first, or <b>Start empty</b>.</>,
      },
      {
        ko: <><b>팀</b> → <b>멤버</b> → <b>일정</b> 순서로 채워요(<b>반복 일정 추가</b>로 매주 연습을 한 번에 만들어요).</>,
        en: <>Fill in <b>Teams</b> → <b>Members</b> → <b>Schedule</b> (<b>Add repeating dates</b> creates every weekly rehearsal at once).</>,
      },
      {
        ko: <><b>브랜딩</b>에서 로고와 색을 고르고 <b>브랜드 공개</b>, <b>기본 설정</b>에서 팀 이름을 바꿔요.</>,
        en: <>Pick a logo and colours under <b>Branding</b> and press <b>Publish brand</b>; set your group&apos;s name under <b>General</b>.</>,
      },
    ],
  },
  {
    title: { ko: "팀원들에게 공유하기", en: "Share it" },
    body: [
      {
        ko: <>내 주소(<code>/admin</code> 없이)를 단톡방에 보내요. 각자 언어와 팀을 고르고, 날짜를 눌러 ✓/✕ 표시한 뒤 저장하면 끝이에요.</>,
        en: <>Send your address (without <code>/admin</code>) to the group chat. Each person picks a language and team, taps their dates ✓/✕, and saves.</>,
      },
      {
        ko: <>폰에서는 공유 메뉴의 <UI>Add to Home Screen</UI>(홈 화면에 추가)으로 앱처럼 쓸 수 있어요.</>,
        en: <>On a phone, <UI>Add to Home Screen</UI> from the share menu makes it open like an app.</>,
      },
    ],
  },
];

const HELP: { q: L; a: L }[] = [
  {
    q: { ko: "데이터베이스 단계가 안 나왔어요", en: "There was no database step" },
    a: {
      ko: <>배포는 그대로 끝내고, Vercel 프로젝트에서 <UI>Storage</UI> → <UI>Create Database</UI> → <UI>Neon</UI> → 무료 플랜 → <UI>Connect</UI>. 그다음 <UI>Deployments</UI>에서 맨 위 항목의 <UI>⋯</UI> → <UI>Redeploy</UI>를 눌러요.</>,
      en: <>Finish the deploy anyway. In your Vercel project open <UI>Storage</UI> → <UI>Create Database</UI> → <UI>Neon</UI> → free plan → <UI>Connect</UI>, then <UI>Deployments</UI> → <UI>⋯</UI> on the newest one → <UI>Redeploy</UI>.</>,
    },
  },
  {
    q: { ko: "관리 비밀번호를 잊어버렸어요", en: "I forgot the admin password" },
    a: {
      ko: <>Vercel 프로젝트 → <UI>Settings</UI> → <UI>Environment Variables</UI>에서 <UI>ADMIN_PASSWORD</UI>를 바꾸고, 위처럼 <UI>Redeploy</UI> 해요.</>,
      en: <>Vercel project → <UI>Settings</UI> → <UI>Environment Variables</UI>, change <UI>ADMIN_PASSWORD</UI>, then <UI>Redeploy</UI> as above.</>,
    },
  },
  {
    q: { ko: "누가 볼 수 있나요? 비용은요?", en: "Who can see it? What does it cost?" },
    a: {
      ko: <>링크를 아는 사람은 누구나 출석을 표시할 수 있어요(모든 변경은 기록되고 관리자가 되돌릴 수 있어요). 그래서 링크는 팀원끼리만 공유하세요. 이름과 출석만 저장되고, 팀 규모라면 Vercel과 Neon 무료 플랜으로 충분해요.</>,
      en: <>Anyone with the link can mark attendance (every change is logged and an admin can undo it), so share it only with your group. It stores names and attendance only, and the free Vercel and Neon plans are enough for a company-sized group.</>,
    },
  },
];

export default function StartGuide() {
  const { prefs, setPrefs, ready } = usePreferences();
  if (!ready) return <LoadingScreen lang={prefs.lang} />;
  const lang = prefs.lang;
  const ko = lang === "ko";
  const t = (x: L) => x[lang];

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <main className={`max-w-2xl mx-auto px-4 ${ko ? "break-keep" : ""} pt-[max(1.25rem,env(safe-area-inset-top))] pb-16`}>
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="press inline-flex items-center gap-1.5 min-h-11 text-sm font-medium text-zinc-400 hover:text-zinc-100">
            <Icon name="chevronDown" className="w-4 h-4 rotate-90" />
            {ko ? "데모로 돌아가기" : "Back to the demo"}
          </Link>
          <div className="w-44">
            <Segmented
              label={ko ? "언어" : "Language"}
              value={lang}
              onChange={(v) => setPrefs({ lang: v })}
              options={[
                { value: "ko", label: "한국어" },
                { value: "en", label: "English" },
              ]}
            />
          </div>
        </div>

        <h1 className="mt-6 text-2xl sm:text-3xl font-bold leading-tight">
          {ko ? "우리 팀 출석부 만들기" : "Make your own schedule"}
        </h1>
        <p className="mt-3 text-base text-zinc-300 leading-relaxed">
          {ko
            ? "이 데모와 똑같은 출석부를 우리 팀 주소로 만들 수 있어요. 코딩 없이 브라우저에서 10분 정도면 되고, 무료예요."
            : "Get a copy of this scheduler at your own address. About ten minutes in a browser, no coding, free."}
        </p>

        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-sm font-semibold text-zinc-100">{ko ? "필요한 것" : "You'll need"}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-zinc-300 leading-relaxed">
            <li>
              • {ko ? "GitHub 계정 (무료) — " : "A GitHub account (free) — "}
              <a href="https://github.com/signup" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline underline-offset-2">github.com/signup</a>
            </li>
            <li>• {ko ? "Vercel 계정 — 버튼을 누르면 GitHub로 바로 만들어져요" : "A Vercel account — made for you with GitHub when you press the button"}</li>
            <li>• {ko ? "팀 이름, 팀원 이름, 연습 날짜" : "Your group's name, members and rehearsal dates"}</li>
          </ul>
        </div>

        <a
          href={SITE.deployUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="press mt-5 flex items-center justify-center gap-2 min-h-12 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-500"
        >
          {ko ? "Vercel로 만들기 (Deploy)" : "Deploy with Vercel"}
          <Icon name="external" className="w-4 h-4" />
        </a>
        <p className="mt-2 text-xs text-zinc-400 text-center">
          {ko ? "새 탭에서 열려요. 이 페이지를 옆에 두고 따라 하세요." : "Opens in a new tab — keep this page open alongside."}
        </p>

        <ol className="mt-8 space-y-7">
          {STEPS.map((s, i) => (
            <li key={i}>
              <h2 className="flex items-center gap-2.5 text-lg font-semibold">
                <span className="grid place-items-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold shrink-0">{i + 1}</span>
                {t(s.title)}
              </h2>
              <ul className="mt-3 ml-[2.4rem] space-y-2.5 text-[0.9375rem] text-zinc-300 leading-relaxed list-disc marker:text-zinc-600">
                {s.body.map((b, j) => (
                  <li key={j}>{t(b)}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <h2 className="mt-10 text-lg font-semibold">{ko ? "막히면" : "If you get stuck"}</h2>
        <div className="mt-3 space-y-2">
          {HELP.map((h, i) => (
            <details key={i} className="group rounded-xl border border-zinc-800 bg-zinc-900/60">
              <summary className="press flex items-center justify-between gap-3 min-h-12 px-4 cursor-pointer list-none text-sm font-medium text-zinc-100">
                {t(h.q)}
                <Icon name="chevronDown" className="w-4 h-4 text-zinc-400 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-4 pb-4 text-sm text-zinc-300 leading-relaxed">{t(h.a)}</p>
            </details>
          ))}
        </div>

        <p className="mt-8 text-sm text-zinc-400 leading-relaxed">
          {ko ? "더 자세한 단계별 안내는 " : "The full step-by-step guide is "}
          <a href={SITE.guideUrl[lang]} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline underline-offset-2">
            {ko ? "설치 안내서" : "on GitHub"}
          </a>
          {ko ? "를 참고하세요. 먼저 둘러보고 싶다면 " : ". Want to look around first? "}
          <Link href="/admin" className="text-blue-400 underline underline-offset-2">
            {ko ? "데모 관리 페이지" : "Try the demo admin"}
          </Link>
          {ko ? "에서 마음껏 바꿔 봐도 돼요." : " — nothing you change there can break anything."}
        </p>
      </main>
    </div>
  );
}
