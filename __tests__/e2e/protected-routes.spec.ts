import { expect } from "@playwright/test";
import { test } from "./support/fixtures";

const LOGIN_URL_REGEX = /\/auth\/login$/;

const protectedPaths = [
  "/games/create",
  "/notifications",
  "/profile",
  "/spending-history",
  "/games/g-free-1/pick",
] as const;

test.describe("Protected Route Redirects", () => {
  for (const routePath of protectedPaths) {
    test(`redirects ${routePath} to login`, async ({ page }) => {
      await page.goto(routePath);
      await expect(page).toHaveURL(LOGIN_URL_REGEX);
      await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    });
  }
});
