import { test, expect } from "@playwright/test";

// What someone sees right after a one-click deploy: an empty database, no seed step.
// Run with FIRST_RUN=1 against a fresh database (see playwright.config.ts).
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "test-admin";

test("a brand-new site leads its owner from the schedule to a loaded sample", async ({ page }) => {
  // fresh browser: no saved preferences, so no welcome popup should block the way
  await page.goto("/");
  const openAdmin = page.getByRole("link", { name: /Open admin|관리 페이지 열기/ });
  await expect(openAdmin).toBeVisible();
  await openAdmin.click();

  await page.getByLabel(/Password|비밀번호/).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /Sign in|들어가기/ }).click();

  // the welcome card offers both starts
  await expect(page.getByRole("button", { name: /Start empty|빈 상태로 시작/ })).toBeVisible();
  const loadSample = page.getByRole("button", { name: /Load the sample|예시 불러오기/ });
  await expect(loadSample).toBeVisible();

  // "Start empty" opens the team editor; close it without saving
  await page.getByRole("button", { name: /Start empty|빈 상태로 시작/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  await loadSample.click();
  await expect(loadSample).toBeHidden();

  // the schedule now has people and dates
  await page.goto("/");
  await expect(page.locator("table")).toBeVisible();
  await expect(page.locator("tbody th[scope=row]").first()).toBeVisible();
});

test("the start page links to the one-click deploy", async ({ page }) => {
  await page.goto("/start");
  const deploy = page.getByRole("link", { name: /Deploy|Vercel로 만들기/ });
  await expect(deploy).toHaveAttribute("href", /vercel\.com\/new\/clone\?repository-url=.*products=/);
});

// Runs last: it changes the password. CI sets ADMIN_PASSWORD_IS_TEMPORARY=1, as scripts/host-team.sh does.
test("the organiser replaces the temporary password, and the host can reset it", async ({ page, context }) => {
  const signIn = async (pw: string) => {
    await page.goto("/admin");
    await page.getByLabel(/^(Password|비밀번호)$/).fill(pw);
    await page.getByRole("button", { name: /Sign in|들어가기/ }).click();
  };
  const tabs = page.getByRole("tablist");

  await signIn(ADMIN_PASSWORD);
  await expect(tabs).toBeVisible();
  // the reminder banner takes the organiser to the form
  await page.getByRole("button", { name: /^(Change password|비밀번호 바꾸기)$/ }).click();
  const ours = "our own long secret";
  await page.getByLabel(/^(Current password|지금 비밀번호)$/).fill(ADMIN_PASSWORD);
  await page.getByLabel(/^(New password|새 비밀번호)$/).fill(ours);
  await page.getByLabel(/^(New password again|새 비밀번호 확인)$/).fill(ours);
  await page.getByRole("button", { name: /^(Change password|비밀번호 바꾸기)$/ }).click();
  await expect(page.getByText(/Password changed|비밀번호를 바꿨어요/)).toBeVisible();
  // still signed in on this device, and no more reminder
  await page.reload();
  await expect(tabs).toBeVisible();
  await expect(page.getByText(/temporary password you were given|처음 받은 임시 비밀번호를 쓰고/)).toBeHidden();

  // the temporary password no longer works; the new one does
  await context.clearCookies();
  await signIn(ADMIN_PASSWORD);
  await expect(page.getByRole("alert").filter({ hasText: /./ })).toBeVisible();
  await expect(tabs).toBeHidden();
  await signIn(ours);
  await expect(tabs).toBeVisible();

  // the host resets a forgotten password from the terminal; it applies with no redeploy
  const { execFileSync } = await import("node:child_process");
  execFileSync("node", ["scripts/set-admin-password.mjs", "reset by the host"], { env: process.env, stdio: "pipe" });
  await context.clearCookies();
  await signIn(ours);
  await expect(page.getByRole("alert").filter({ hasText: /./ })).toBeVisible();
  await signIn("reset by the host");
  await expect(tabs).toBeVisible();
  await expect(page.getByText(/temporary password you were given|처음 받은 임시 비밀번호를 쓰고/)).toBeVisible();
});
