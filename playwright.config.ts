import { defineConfig, devices } from "@playwright/test";

// Smoke tests: the schedule must load, lay out and save in every major browser
// engine. Run against a seeded database:
//   DATABASE_URL=… ADMIN_PASSWORD=test-admin npm run build && npm run seed -- --reset && npm test
const PORT = 3210;

export default defineConfig({
  testDir: "tests",
  workers: 1, // the tests share one database
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${PORT}`, locale: "en-US" },
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
