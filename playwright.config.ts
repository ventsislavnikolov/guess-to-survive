import { defineConfig, devices } from "@playwright/test";

const baseUrl = "http://127.0.0.1:4173";

export default defineConfig({
  reporter: "html",
  fullyParallel: true,
  testDir: "./__tests__/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI || process.env.E2E_COVERAGE ? 1 : undefined,
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    baseURL: baseUrl,
    viewport: { width: 1920, height: 1080 },
    launchOptions: {
      args: ["--start-maximized", "--start-fullscreen"],
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
  webServer: {
    url: baseUrl,
    timeout: 120 * 1000,
    command: "pnpm dev --host 127.0.0.1 --port 4173",
    env: {
      ...process.env,
      VITE_POSTHOG_KEY: "",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
      VITE_SUPABASE_URL: "https://gts-mock.supabase.co",
    },
    reuseExistingServer: !process.env.CI,
  },
});
