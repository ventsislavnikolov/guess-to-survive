import { expect } from "@playwright/test";
import { test } from "./support/fixtures";

const ROOT_URL_REGEX = /\/$/;

test.describe("Auth Pages", () => {
  test("renders sign-up form content", async ({ page }) => {
    await page.goto("/auth/signup");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign up" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  });

  test("renders login form content", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue with Google" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Forgot password?" })
    ).toBeVisible();
  });

  test("renders forgot-password form content", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    await expect(page.getByText("Forgot password")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send reset link" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to login" })
    ).toBeVisible();
  });

  test("shows reset-password invalid-link state without a session", async ({
    page,
  }) => {
    await page.goto("/auth/reset-password");

    await expect(
      page.getByText(
        "Reset link is invalid or has expired. Please request a new one."
      )
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Request a new reset link" })
    ).toBeVisible();
  });

  test("renders auth callback loading state", async ({ page }) => {
    await page.goto("/auth/callback");
    await expect(page).toHaveURL(ROOT_URL_REGEX);
  });
});
