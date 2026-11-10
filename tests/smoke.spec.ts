import { test, expect, type Page } from "@playwright/test";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "test-admin";

// Skip the welcome dialog and pin the language, team and theme.
async function open(page: Page, viewport?: { width: number; height: number }) {
  if (viewport) await page.setViewportSize(viewport);
  await page.addInitScript(() =>
    localStorage.setItem("schedPrefs", JSON.stringify({ lang: "en", theme: "dark", fontSize: "normal", department: "cast", onboarded: true }))
  );
  await page.goto("/");
  await expect(page.locator("table")).toBeVisible();
}

for (const [label, viewport] of [
  ["laptop", { width: 1420, height: 760 }],
  ["phone", { width: 390, height: 844 }],
] as const) {
  test(`schedule lays out on a ${label}`, async ({ page }) => {
    await open(page, viewport);
    const m = await page.evaluate(() => {
      const table = document.querySelector("table")!;
      const dateHeads = [...document.querySelectorAll("thead th")].slice(1);
      const scroller = table.parentElement!.getBoundingClientRect();
      return {
        tableWidth: table.getBoundingClientRect().width,
        people: document.querySelectorAll("tbody th[scope=row]").length,
        dates: dateHeads.length,
        colWidth: dateHeads[0].getBoundingClientRect().width,
        // date columns that are actually inside the visible table area
        visibleDates: dateHeads.filter((th) => {
          const r = th.getBoundingClientRect();
          return r.left >= scroller.left && r.right <= scroller.right + 1;
        }).length,
      };
    });
    expect(m.people).toBeGreaterThan(0);
    expect(m.dates).toBeGreaterThan(0);
    // a date column is a tap target, not a sliver or a wall (Firefox once made it 500,000 px wide)
    expect(m.colWidth).toBeGreaterThanOrEqual(40);
    expect(m.colWidth).toBeLessThanOrEqual(80);
    expect(m.tableWidth).toBeLessThan(6000);
    expect(m.visibleDates).toBeGreaterThanOrEqual(3);
  });
}

test("a member can mark a date and save it", async ({ page }, info) => {
  await open(page, { width: 1280, height: 800 });
  // each browser project uses its own row, so runs don't collide in the shared database
  const row = page.locator("tbody tr:has(th[scope=row])").nth(info.project.name === "chromium" ? 0 : info.project.name === "firefox" ? 1 : 2);
  const cell = row.locator("td button").nth(3);
  const before = await cell.getAttribute("aria-label");
  await cell.click();
  await expect(cell).not.toHaveAttribute("aria-label", before!);

  await page.getByRole("button", { name: /^Save/ }).locator("visible=true").first().click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("select").selectOption({ index: 1 });
  // marking "can't come" needs a reason; pick the first preset if the sheet asks for one
  const reason = dialog.getByRole("button", { name: "Personal reasons" });
  if (await reason.isVisible().catch(() => false)) await reason.click();
  await dialog.getByRole("button", { name: /^Save/ }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await expect(page.getByText(/marked (attending|absent|cleared) on 1 date/).first()).toBeVisible();
});

test("the admin is locked without the password and opens with it", async ({ page, request }) => {
  expect((await request.get("/api/admin")).status()).toBe(401);
  expect((await request.post("/api/admin/login", { data: { password: "definitely-wrong" } })).status()).toBe(401);

  await page.addInitScript(() =>
    localStorage.setItem("schedPrefs", JSON.stringify({ lang: "en", theme: "dark", fontSize: "normal", department: "cast", onboarded: true }))
  );
  await page.goto("/admin");
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("tab", { name: "Members" })).toBeVisible();
  await page.getByRole("tab", { name: "Branding" }).click();
  await expect(page.getByText("Readability check")).toBeVisible();
});
