import fs from "node:fs";
import path from "node:path";
import {
  type BrowserContext,
  test as base,
  type TestInfo,
} from "@playwright/test";
import {
  createMockSupabaseState,
  installSupabaseMocks,
  type MockSupabaseState,
  seedAuthenticatedSession,
} from "./mock-supabase";

interface E2EFixtures {
  mockState: MockSupabaseState;
  seedAuthSession: (userId?: string) => Promise<void>;
}

interface E2EInternalFixtures {
  _collectCoverage: undefined;
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 140);
}

async function persistIstanbulCoverage(
  context: BrowserContext,
  testInfo: TestInfo
) {
  if (process.env.E2E_COVERAGE !== "true") {
    return;
  }

  const outputDir = path.resolve(".nyc_output");
  fs.mkdirSync(outputDir, { recursive: true });

  const rawTitlePath =
    typeof (testInfo as TestInfo & { titlePath?: unknown }).titlePath ===
    "function"
      ? (testInfo as TestInfo & { titlePath: () => string[] }).titlePath()
      : (testInfo as TestInfo & { titlePath?: unknown }).titlePath;
  const titlePath = Array.isArray(rawTitlePath) ? rawTitlePath.join("-") : "";
  const baseName = sanitizeFileName(titlePath || testInfo.title);

  let index = 0;

  for (const page of context.pages()) {
    if (page.isClosed()) {
      continue;
    }

    try {
      const coverage = await page.evaluate(() => {
        return (
          (window as Window & { __coverage__?: unknown }).__coverage__ ?? null
        );
      });

      if (!(coverage && typeof coverage === "object")) {
        continue;
      }

      const filePath = path.join(
        outputDir,
        `${baseName}-${testInfo.retry}-${index}.json`
      );
      fs.writeFileSync(filePath, JSON.stringify(coverage), "utf8");
      index += 1;
    } catch {
      // Ignore pages that are cross-origin or no longer scriptable.
    }
  }
}

export const test = base.extend<E2EFixtures & E2EInternalFixtures>({
  mockState: [
    async ({ context }, use) => {
      const state = createMockSupabaseState();
      await installSupabaseMocks(context, state);
      await use(state);
    },
    { auto: true },
  ],

  seedAuthSession: async ({ mockState, page }, use) => {
    await use(async (userId?: string) => {
      await seedAuthenticatedSession(page, mockState, userId);
    });
  },

  _collectCoverage: [
    async ({ context }, use, testInfo) => {
      await use();
      await persistIstanbulCoverage(context, testInfo);
    },
    { auto: true },
  ],
});
