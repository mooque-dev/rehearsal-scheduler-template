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
  await page.getByRole("button", { name: /Sign in|로그인/ }).click();

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
