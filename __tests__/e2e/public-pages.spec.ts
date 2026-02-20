import { expect } from "@playwright/test";
import { test } from "./support/fixtures";

const WEEKEND_POOL_LINK_REGEX = /Weekend Survival Free Pool/;
const FREE_GAME_DETAIL_URL_REGEX = /\/games\/g-free-1$/;

test.describe("Public Pages", () => {
  test("renders home page and navigates to game detail", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Survive. Predict. Win." })
    ).toBeVisible();
    await expect(page.getByText("Weekend Survival Free Pool")).toBeVisible();

    await page.getByRole("link", { name: WEEKEND_POOL_LINK_REGEX }).click();

    await expect(page).toHaveURL(FREE_GAME_DETAIL_URL_REGEX);
    await expect(page.getByText("Game info")).toBeVisible();
    await expect(page.getByText("Leaderboard")).toBeVisible();
  });

  test("shows browser filters and filters paid games", async ({ page }) => {
    await page.goto("/games");

    await expect(page.getByText("Game browser")).toBeVisible();
    await expect(page.getByText("Weekend Survival Free Pool")).toBeVisible();

    await page.selectOption("#payment-filter", "paid");

    await expect(page.getByText("High Stakes Paid Pool")).toBeVisible();
    await expect(page.getByText("Weekend Survival Free Pool")).toHaveCount(0);

    await page.click("button:has-text('Reset filters')");

    await expect(page.getByText("Weekend Survival Free Pool")).toBeVisible();
    await expect(page.getByText("High Stakes Paid Pool")).toBeVisible();
  });

  test("renders how-it-works and legal pages", async ({ page }) => {
    await page.goto("/how-it-works");
    await expect(page.getByText("How Guess to Survive works")).toBeVisible();

    await page.goto("/terms");
    await expect(page.getByText("Terms of Service")).toBeVisible();

    await page.goto("/privacy");
    await expect(page.getByText("Privacy Policy")).toBeVisible();
  });

  test("renders empty featured state and example fallbacks", async ({
    mockState,
    page,
  }) => {
    mockState.games = mockState.games.map((game) => ({
      ...game,
      status: game.visibility === "public" ? "active" : game.status,
    }));
    mockState.fixtures = [];

    await page.goto("/");

    await expect(page.getByText("No pending public games yet.")).toBeVisible();
    await expect(page.getByText("Example pick")).toBeVisible();
    await expect(page.getByText("TBD")).toBeVisible();
  });

  test("renders authenticated home CTAs", async ({
    mockState,
    page,
    seedAuthSession,
  }) => {
    mockState.games = mockState.games.map((game) => ({
      ...game,
      status: game.visibility === "public" ? "active" : game.status,
    }));

    await seedAuthSession();
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Create a game" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Create a pool" })
    ).toBeVisible();
  });

  test("renders featured-game error state when rpc fails", async ({ page }) => {
    await page.route("**/rest/v1/rpc/list_public_games", async (route) => {
      await route.fulfill({
        body: JSON.stringify({ message: "Failed to list games" }),
        contentType: "application/json",
        status: 500,
      });
    });

    await page.goto("/");

    await expect(
      page.getByText("Unable to load featured games.")
    ).toBeVisible();
    await expect(page.getByText("Please try again.")).toBeVisible();
  });

  test("renders featured-game error state when rpc request aborts", async ({
    page,
  }) => {
    await page.route("**/rest/v1/rpc/list_public_games", async (route) => {
      await route.abort("failed");
    });

    await page.goto("/");

    await expect(
      page.getByText("Unable to load featured games.")
    ).toBeVisible();
  });

  test("renders nullish featured values safely", async ({
    mockState,
    page,
  }) => {
    const baseGame = mockState.games.find(
      (game) => game.visibility === "public" && game.status === "pending"
    );

    if (!baseGame) {
      throw new Error(
        "Expected at least one pending public game in mock state."
      );
    }

    await page.route("**/rest/v1/rpc/list_public_games", async (route) => {
      await route.fulfill({
        body: JSON.stringify([
          {
            ...baseGame,
            code: null,
            max_players: null,
            player_count: null,
            total_count: 1,
          },
        ]),
        contentType: "application/json",
        status: 200,
      });
    });

    await page.goto("/");

    await expect(page.getByText("Code N/A")).toBeVisible();
    await expect(page.getByText("0 / ∞")).toBeVisible();
  });

  test("uses currency and kickoff fallbacks for invalid source data", async ({
    mockState,
    page,
  }) => {
    const featuredGame = mockState.games.find(
      (game) => game.visibility === "public" && game.status === "pending"
    );

    if (featuredGame) {
      featuredGame.entry_fee = 12;
      featuredGame.currency = "BAD";
    }

    if (mockState.fixtures.length > 0) {
      mockState.fixtures[0].kickoff_time = "not-a-date";
    }

    await page.goto("/");

    await expect(page.getByText("BAD 12.00")).toBeVisible();
    await expect(page.getByText("Kickoff", { exact: true })).toBeVisible();
  });
});
