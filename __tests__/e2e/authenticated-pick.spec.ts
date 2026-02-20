import { expect } from "@playwright/test";
import { test } from "./support/fixtures";

const PICK_PAGE_URL_REGEX = /\/games\/g-free-1\/pick$/;
const ARSENAL_BUTTON_REGEX = /^Arsenal/;

test.describe("Authenticated Pick Flow", () => {
  test.beforeEach(async ({ seedAuthSession }) => {
    await seedAuthSession();
  });

  test("submits a pick after joining a free game", async ({ page }) => {
    await page.goto("/games/g-free-1");

    await page.getByRole("button", { name: "Join game" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Join" })
      .click();

    await page.getByRole("link", { name: "Make pick" }).click();

    await expect(page).toHaveURL(PICK_PAGE_URL_REGEX);
    await expect(page.getByText("Team selection")).toBeVisible();

    await page
      .getByRole("button", { name: ARSENAL_BUTTON_REGEX })
      .first()
      .click();
    await page.getByRole("button", { name: "Confirm pick" }).click();

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByText("Current pick: Arsenal")).toBeVisible();
  });

  test("supports search and list view toggling", async ({ page }) => {
    await page.goto("/games/g-free-1/pick");

    await page.getByPlaceholder("Search team...").fill("zzzz");
    await expect(page.getByText("No teams match your search.")).toBeVisible();

    await page.getByPlaceholder("Search team...").fill("");
    await page.getByRole("button", { name: "List" }).click();

    await expect(
      page.getByRole("button", { name: ARSENAL_BUTTON_REGEX }).first()
    ).toBeVisible();
    await page.getByRole("button", { name: "Cards" }).click();
    await expect(
      page.getByRole("button", { name: ARSENAL_BUTTON_REGEX }).first()
    ).toBeVisible();
  });
});
