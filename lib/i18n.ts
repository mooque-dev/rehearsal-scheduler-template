import { SITE } from "@/lib/site.config";
export type Lang = "ko" | "en";
export const DEPARTMENTS = ["actors", "production", "marketing"] as const;
export type DepartmentKey = (typeof DEPARTMENTS)[number];
export const ROLES = ["Main/Sub", "Ensemble", "Coach"] as const;
export const ROLE_FILTERS = ["All", "Main/Sub", "Ensemble", "Coach", "Unassigned"] as const;

export const STRINGS = {
  en: {
    title: SITE.title.en,
    tapToCycle: "Tap to toggle:",
    yes: "yes",
    maybe: "maybe",
    unset: "not set",
    legendUnset: "Not selected",
    missedTotal: "Days marked absent",
    attendanceSummary: "Attendance summary",
    attendanceShort: "Attendance",
    also: "Also",
    alsoLegend: "Also in Ensemble",
    sortAbsences: "By days out",
    sortName: "Name",
    noAbsences: "No absences",
    no: "no",
    dates: "dates",
    people: "people",
    save: "Save",
    settings: "Settings",
    unsaved: "Unsaved changes — tap Save to persist.",
    updateLog: "Update Log",
    name: "Name",
    all: "All",
    "Main/Sub": "Leads & Supporting",
    Ensemble: "Ensemble",
    Coach: "Coach",
    Unassigned: "Unassigned",
    show: "SHOW",
    coachVisit: "Coach visit",
    coachShort: "Coach",
    language: "Language",
    theme: "Theme",
    fontSize: "Font Size",
    dark: "Dark",
    light: "Light",
    normal: "Normal",
    large: "Large",
    xlarge: "Extra Large",
    korean: "한국어",
    english: "English",
    welcomeTitle: "Welcome",
    welcomeSub: "Choose your preferences to get started.",
    continue: "Continue",
    whoSaving: "Who is saving?",
    whoSavingDesc: "Select your name so we can log who made these changes.",
    selectName: "Select your name...",
    otherName: "Other (type a name)...",
    enterName: "Enter your name",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    saving: "Saving...",
    noLogYet: "No changes saved yet.",
    showMore: "more...",
    none: "None",
    close: "Close",
    revert: "Revert",
    reverted: "Reverted",
    confirmRevert: "Revert this change? The schedule will be restored to its previous state.",
    notices: "Notices",
    calendar: "Calendar",
    upcoming: "Upcoming",
    past: "Past",
    noNotices: "No announcements.",
    department: "Department",
    actors: "Actors",
    production: "Production",
    marketing: "Marketing",
    teamLead: "Team Lead",
    noPeopleYet: "No one's been added to this season yet.",
    archiveReadOnly: "Season 1 · Read-only archive",
    archivePinPrompt: "Enter the archive passphrase",
    archivePinPlaceholder: "Passphrase",
    archivePinSubmit: "Unlock",
    archivePinError: "Incorrect passphrase.",
    resources: "Resources",
    standingInfo: "Standing Info",
    rehearsalLocation: "Rehearsal Location",
    rehearsalTime: "Rehearsal Time",
    duesContact: "Dues (e-transfer)",
    reasonPrompt: "Why won't you be there?",
    reasonDesc: "Marking yourself absent needs a reason — pick one or write your own.",
    reasonPersonal: "Personal reasons",
    reasonHealth: "Health / sick",
    reasonSchoolWork: "School or work",
    reasonTravel: "Travel",
    reasonOther: "Other (type your own)...",
    enterReason: "Enter a reason",
    showDetails: "Show who",
    hideDetails: "Hide",
    adminPassword: "Admin password",
    wrongPassword: "Incorrect admin password.",
    revertTitle: "Revert this change",
    revertWillRestore: "These dates go back to how they were before this save.",
    yourName: "Your name",
    revertFailed: "Couldn't revert. Please try again.",
    viewList: "List",
    viewCalendar: "Calendar",
    noNoticesOnDay: "Nothing scheduled on this day.",
    legendRehearsal: "Rehearsal",
    legendBreak: "No rehearsal",
    breakDay: "No rehearsal — winter break.",
    legendNotice: "Notice",
    rehearsalDay: "Rehearsal day",
    castOnly: "Cast only",
  },
  ko: {
    title: SITE.title.ko,
    tapToCycle: "탭하여 변경:",
    yes: "참석",
    maybe: "미정",
    unset: "미선택",
    legendUnset: "미선택",
    missedTotal: "불참 합계",
    attendanceSummary: "출결 현황",
    attendanceShort: "출결 현황",
    also: "겸임",
    alsoLegend: "앙상블 겸임",
    sortAbsences: "불참 일수순",
    sortName: "이름순",
    noAbsences: "불참 없음",
    no: "불참",
    dates: "일정",
    people: "명",
    save: "저장",
    settings: "설정",
    unsaved: "저장되지 않은 변경사항이 있습니다.",
    updateLog: "업데이트 기록",
    name: "이름",
    all: "전체",
    "Main/Sub": "주/조연",
    Ensemble: "앙상블",
    Coach: "코치",
    Unassigned: "미지정",
    show: "공연",
    coachVisit: "코치 방문",
    coachShort: "코치",
    language: "언어",
    theme: "테마",
    fontSize: "글꼴 크기",
    dark: "다크",
    light: "라이트",
    normal: "보통",
    large: "크게",
    xlarge: "매우 크게",
    korean: "한국어",
    english: "English",
    welcomeTitle: "환영합니다",
    welcomeSub: "설정을 선택하고 시작하세요.",
    continue: "시작하기",
    whoSaving: "저장하는 사람",
    whoSavingDesc: "누가 변경했는지 기록하기 위해 이름을 선택해주세요.",
    selectName: "이름을 선택하세요...",
    otherName: "직접 입력...",
    enterName: "이름을 입력하세요",
    cancel: "취소",
    saveChanges: "저장",
    saving: "저장 중...",
    noLogYet: "아직 저장된 변경사항이 없습니다.",
    showMore: "더 보기...",
    none: "없음",
    close: "닫기",
    revert: "되돌리기",
    reverted: "되돌림",
    confirmRevert: "이 변경사항을 되돌리시겠습니까? 이전 상태로 복원됩니다.",
    notices: "공지사항",
    calendar: "달력",
    upcoming: "예정",
    past: "지난 일정",
    noNotices: "공지사항이 없습니다.",
    department: "소속",
    actors: "배우팀",
    production: "연출팀",
    marketing: "홍보팀",
    teamLead: "팀장",
    noPeopleYet: "아직 이 시즌에 등록된 인원이 없습니다.",
    archiveReadOnly: "시즌 1 · 읽기 전용 아카이브",
    archivePinPrompt: "아카이브 비밀번호를 입력하세요",
    archivePinPlaceholder: "비밀번호",
    archivePinSubmit: "잠금 해제",
    archivePinError: "비밀번호가 올바르지 않습니다.",
    resources: "자료",
    standingInfo: "안내",
    rehearsalLocation: "연습 장소",
    rehearsalTime: "연습 시간",
    duesContact: "회비 (계좌이체)",
    reasonPrompt: "불참 사유를 알려주세요",
    reasonDesc: "불참으로 표시하려면 사유가 필요해요 — 선택하거나 직접 입력해주세요.",
    reasonPersonal: "개인 사정",
    reasonHealth: "건강 문제",
    reasonSchoolWork: "학교/직장 일정",
    reasonTravel: "여행",
    reasonOther: "기타 (직접 입력)...",
    enterReason: "사유를 입력하세요",
    showDetails: "대상 보기",
    hideDetails: "접기",
    adminPassword: "관리자 비밀번호",
    wrongPassword: "관리자 비밀번호가 올바르지 않습니다.",
    revertTitle: "변경사항 되돌리기",
    revertWillRestore: "이 저장 이전 상태로 복원됩니다.",
    yourName: "이름",
    revertFailed: "되돌리지 못했습니다. 다시 시도해 주세요.",
    viewList: "목록",
    viewCalendar: "달력",
    noNoticesOnDay: "이 날은 공지가 없습니다.",
    legendRehearsal: "연습",
    legendBreak: "연습 없음",
    breakDay: "연습 없는 날 (겨울 휴식)",
    legendNotice: "공지",
    rehearsalDay: "연습일",
    castOnly: "배우팀만",
  },
} as const;

export type StringKey = keyof (typeof STRINGS)["en"];

export function t(lang: Lang, key: StringKey): string {
  return STRINGS[lang][key];
}

// Team tab names come from site.config.ts (the storage keys never change).
export function seasonDeptLabel(d: DepartmentKey, lang: Lang): string {
  return SITE.departments[d][lang];
}

// Seasons that start everyone at "not selected" cycle through it as well.
export const STATUS_CYCLE_UNSET: Record<string, "yes" | "maybe" | "no" | "unset"> = {
  unset: "yes",
  yes: "no",
  no: "unset",
  maybe: "yes",
};

export const STATUS_CYCLE: Record<string, "yes" | "maybe" | "no"> = {
  yes: "no",
  no: "yes",
  // Retired as a choice (abuse concerns); old rows can still exist, a tap clears them.
  maybe: "yes",
};

// Coaches store their specialty in the `character_name` column (there's no
// dedicated field for it), tagged with this prefix so it renders through the
// language toggle like everything else — unlike an actor's actual character
// name, which is a proper noun and is never translated.
const SPECIALTY_PREFIX = "spec:";
const SPECIALTY_LABELS: Record<string, { ko: string; en: string }> = {
  music: { ko: "음악", en: "Music" },
  vocal: { ko: "보컬", en: "Vocal" },
  acting: { ko: "연기", en: "Acting" },
};

export function specialtyCode(key: keyof typeof SPECIALTY_LABELS): string {
  return SPECIALTY_PREFIX + key;
}

export function displayCharacterName(characterName: string, lang: Lang): string {
  if (characterName.startsWith(SPECIALTY_PREFIX)) {
    const key = characterName.slice(SPECIALTY_PREFIX.length);
    return SPECIALTY_LABELS[key]?.[lang] ?? characterName;
  }
  return characterName;
}

export const ABSENCE_REASON_PRESETS: StringKey[] = [
  "reasonPersonal",
  "reasonHealth",
  "reasonSchoolWork",
  "reasonTravel",
];

export const ROLE_ORDER: Record<string, number> = { "Main/Sub": 0, Ensemble: 1, Coach: 2 };
export const ROLE_DOT_COLOR: Record<string, string> = {
  "Main/Sub": "bg-blue-400",
  Ensemble: "bg-emerald-400",
  Coach: "bg-amber-400",
};
export const ROLE_RING_COLOR: Record<string, string> = {
  "Main/Sub": "ring-blue-400/40",
  Ensemble: "ring-emerald-400/40",
  Coach: "ring-amber-400/40",
};
