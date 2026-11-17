# 시작하기 — 코딩 없이

[English guide](GETTING-STARTED.md)

우리 팀만의 출석부를 만드는 방법이에요. 우리 팀 주소, 우리 팀원, 우리 팀 디자인으로요. 10분쯤 걸리고, 모든 과정이
웹 브라우저 안에서 끝나요. 무료예요.

중간에 무료 계정 두 개가 필요해요(이미 있으면 그걸 쓰면 돼요).

- **GitHub**: 내 출석부 앱의 복사본을 보관해요. → https://github.com/signup
- **Vercel**: 그 복사본을 인터넷에 올려서 공유할 수 있는 주소를 만들어요. → 물어보면 GitHub 계정으로 로그인하세요.

먼저 구경해 보고 싶다면 데모가 있어요: https://rehearsal-scheduler-demo.vercel.app (관리 비밀번호 `demo-admin`).
같은 내용을 데모 안에서 보려면 https://rehearsal-scheduler-demo.vercel.app/start 를 여세요.

> Vercel과 GitHub 화면은 영어로 나와요. 그래서 이 안내서에서는 화면에 보이는 버튼 이름을 영어 그대로 적었어요.

## 1. 내 복사본 만들기

1. **[이 링크](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmooque-dev%2Frehearsal-scheduler-template&project-name=rehearsal-scheduler&repository-name=rehearsal-scheduler&env=ADMIN_PASSWORD&envDescription=%EA%B4%80%EB%A6%AC%20%ED%8E%98%EC%9D%B4%EC%A7%80%20%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8%20%C2%B7%20Password%20for%20your%20%2Fadmin%20page.%20Choose%20a%20long%20one%20and%20keep%20it%20private.&envLink=https%3A%2F%2Fgithub.com%2Fmooque-dev%2Frehearsal-scheduler-template%23get-your-own-about-10-minutes-no-coding&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)** 를 열어요(첫 페이지의 "Deploy with Vercel" 버튼과 같아요).
2. 로그인하라고 하면 **GitHub** 버튼을 눌러 GitHub 계정으로 Vercel에 로그인해요.
3. **Create Git Repository**: 이름은 그대로 두거나 팀 이름으로 바꿔요(띄어쓰기 없이). **Private** 은 켜 둔 채로
   **Create** 를 눌러요.
4. **데이터베이스 단계**: **Neon** 데이터베이스를 만들자고 나오면 무료 플랜을 고르고 계속 진행해요. Neon이 약관
   동의를 한 번 물어볼 수 있어요.
5. **Environment Variables**: **ADMIN_PASSWORD** 칸에 관리 페이지 비밀번호를 정해서 넣어요. 길게 만들고(짧은 문장도
   좋아요) 안전한 곳에 적어 두세요. 관리 페이지의 열쇠예요.
6. **Deploy** 를 누르고 1분쯤 기다려요. "Congratulations" 페이지에 내 주소가 나와요. 예:
   `rehearsal-scheduler-yourname.vercel.app`

**4번 단계가 안 나왔다면**(데이터베이스를 만들자는 화면이 없었다면): 배포는 그대로 끝내고, 새 Vercel 프로젝트에서
**Storage → Create Database → Neon** 을 열어 무료 플랜으로 만든 뒤 프로젝트에 연결(**Connect**)해요. 그다음
**Deployments** 에서 맨 위 항목의 **⋯** 를 눌러 **Redeploy** 를 선택해요.

## 2. 우리 팀으로 채우기

1. 내 주소 뒤에 `/admin` 을 붙여서 열고, 정한 관리 비밀번호로 로그인해요.
2. 가상의 예시 팀을 먼저 둘러보려면 **예시 불러오기**, 바로 시작하려면 **빈 상태로 시작** 을 눌러요.
3. **팀**: 그룹마다 탭을 하나씩 만들어요(예: 배우팀, 연출팀, 제작부). 배우팀은 **역할로 묶기** 를 켜면 주/조연,
   앙상블, 코치로 나뉘어 보여요.
4. **멤버**: 팀마다 사람을 추가해요.
5. **일정**: **반복 일정 추가** 를 누르고 요일, 첫 날짜와 마지막 날짜, 시간과 장소를 고르면 매주 연습이 한 번에
   만들어져요. 하루짜리 일정, 휴식 기간, 공연도 같은 곳에서 추가해요.
6. **브랜딩**: 분위기를 고르고, 로고를 올리고, 색을 골라요. **브랜드 공개** 를 눌러야 적용돼요.
7. **기본 설정**: 팀 이름을 적어요.

예시를 불러왔다면 예시 사람과 날짜는 하나씩 지우면 돼요(열어서 **삭제** 를 두 번 누르기).

## 3. 팀원들에게 공유하기

내 주소(`/admin` 없이)를 단톡방에 보내요. 각자:

1. 링크를 열고 언어와 팀을 골라요.
2. 날짜를 눌러 표시해요. **✓** 참석, **✕** 불참, **–** 아직 미선택.
3. **저장** 을 누르고 자기 이름을 고른 뒤, ✕ 를 표시했다면 이유를 적어요.

폰에서는 브라우저 공유 메뉴의 **Add to Home Screen**(홈 화면에 추가)으로 앱처럼 열 수 있어요.

## 관리하기

- **누가 오는지 보기**: 일정표에서 **출결 현황** 을 누르고 **날짜별** 을 골라요.
- **실수 되돌리기**: 일정표 아래 **업데이트 기록** 에서 해당 항목의 **되돌리기** 를 누르고 관리 비밀번호를 넣어요.
- **나중에 바꾸기**: 2단계의 모든 내용은 언제든 `/admin` 에서 바꿀 수 있어요.
- **관리 비밀번호를 잊었다면**: Vercel 프로젝트 → **Settings → Environment Variables** 에서 `ADMIN_PASSWORD` 를 바꾸고
  다시 배포해요(**Deployments → ⋯ → Redeploy**).
- **링크 관리**: 링크를 아는 사람은 누구나 출석을 표시할 수 있어요. 그래서 링크는 팀원끼리만 공유하세요. 관리 비밀번호는
  절대 단톡방에 올리지 마세요.
- **업데이트**: 내 복사본은 내 것이라 저절로 바뀌지 않아요. 나중에 개선된 버전을 받고 싶으면 이걸 알려 준 사람에게
  물어보거나 프로젝트 페이지를 보세요: https://github.com/mooque-dev/rehearsal-scheduler-template

## 자주 보이는 말

- **Repository (저장소, repo)**: GitHub에 있는 내 앱 파일들의 복사본.
- **Deploy (배포)**: 내 복사본의 최신 버전을 인터넷에 올리는 것. Vercel이 자동으로 해 줘요.
- **Environment variable (환경 변수)**: 관리 비밀번호처럼 Vercel에 따로 보관하는 비밀 설정. 파일에는 들어가지 않아요.
- **Database (데이터베이스)**: 사람, 날짜, 출석 답이 저장되는 곳(Neon). 앱 파일에는 이런 내용이 전혀 없어요.
