import { expect } from "@playwright/test";
import { test } from "./support/fixtures";

const CREATED_GAME_URL_REGEX = /\/games\/game-created-\d+$/;
const PAY_AND_JOIN_REGEX = /Pay .* and join/;

test.describe("Authenticated Game Flows", () => {
  test.beforeEach(async ({ seedAuthSession }) => {
    await seedAuthSession();
  });

  test("creates a game from the create page", async ({ page }) => {
    await page.goto("/games/create");

    await expect(page.locator("#starting-round")).toBeVisible();
    await expect(page.locator("#starting-round")).not.toHaveValue("");

    await page.fill("#name", "Codex E2E Created Game");
    await page.getByRole("button", { name: "Create game" }).click();

    await expect(page).toHaveURL(CREATED_GAME_URL_REGEX);
    await expect(
      page.getByRole("heading", { name: "Codex E2E Created Game" }).first()
    ).toBeVisible();
  });

  test("joins and leaves a free game", async ({ page }) => {
    await page.goto("/games/g-free-1");

    await page.getByRole("button", { name: "Join game" }).click();

    const joinDialog = page.getByRole("alertdialog");
    await expect(joinDialog).toBeVisible();
    await joinDialog.getByRole("button", { name: "Join" }).click();

    await expect(
      page.getByRole("button", { name: "Leave game" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Leave game" }).click();

    const leaveDialog = page.getByRole("alertdialog");
    await expect(leaveDialog).toBeVisible();
    await leaveDialog.getByRole("button", { name: "Leave" }).click();

    await expect(page.getByRole("button", { name: "Join game" })).toBeVisible();
  });

  test("shows checkout summary for a paid pending game", async ({ page }) => {
    await page.goto("/games/g-paid-1");

    await expect(
      page.locator("[data-slot='card-title']", { hasText: "Checkout" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: PAY_AND_JOIN_REGEX })
    ).toBeVisible();
  });
});

test.describe("Manager Controls", () => {
  test.beforeEach(async ({ seedAuthSession }) => {
    await seedAuthSession("manager-1");
  });

  test("kicks a player and opens refund flow", async ({ page }) => {
    await page.goto("/games/g-active-rebuy");

    await expect(
      page.locator("[data-slot='card-title']", { hasText: "Manager controls" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Kick + refund" }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Reason").fill("duplicate account");
    await dialog.getByRole("button", { name: "Kick + refund" }).click();

    await expect(dialog).toBeHidden();
  });
});
