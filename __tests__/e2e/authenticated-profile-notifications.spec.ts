import { expect } from "@playwright/test";
import { test } from "./support/fixtures";

const ACTIVE_UNTIL_REGEX = /Active until/;
const PAYMENTS_ERROR_REGEX =
  /Payments service unavailable|Could not load payments/;
const PAYMENTS_ABORT_REGEX =
  /Could not load payments|Failed to fetch|NetworkError/i;

test.describe("Authenticated Profile and Notifications", () => {
  test.beforeEach(async ({ seedAuthSession }) => {
    await seedAuthSession();
  });

  test("marks notifications as read", async ({ page }) => {
    await page.goto("/notifications");

    await expect(page.getByText("Notifications")).toBeVisible();
    await expect(page.getByText("Unread")).toHaveCount(2);

    await page.getByRole("button", { name: "Mark all as read" }).click();

    await expect(page.getByText("Unread")).toHaveCount(0);
  });

  test("updates profile and toggles self-exclusion", async ({ page }) => {
    await page.goto("/profile");

    await expect(page.getByText("Responsible gaming")).toBeVisible();

    await page.getByLabel("Username").fill("codex_user");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page.getByLabel("Username")).toHaveValue("codex_user");

    await page.locator("#self-exclusion-days").fill("3");
    await page.getByRole("button", { name: "Enable" }).click();

    const enableDialog = page.getByRole("alertdialog");
    await expect(enableDialog).toBeVisible();
    await enableDialog.getByRole("button", { name: "Enable" }).click();

    await expect(page.getByText(ACTIVE_UNTIL_REGEX)).toBeVisible();

    await page.getByRole("button", { name: "Clear" }).first().click();

    const clearDialog = page.getByRole("alertdialog");
    await expect(clearDialog).toBeVisible();
    await clearDialog.getByRole("button", { name: "Clear" }).click();

    await expect(page.getByText("Not active")).toBeVisible();
  });

  test("shows spending history totals and rows", async ({ page }) => {
    await page.goto("/spending-history");

    await expect(
      page.getByRole("heading", { name: "Spending history" })
    ).toBeVisible();
    await expect(page.getByText("Gross spent")).toBeVisible();
    await expect(page.getByText("Refunded", { exact: true })).toBeVisible();
    await expect(page.getByText("Net spent")).toBeVisible();
    await expect(page.getByText("Rebuy Showdown")).toBeVisible();
  });

  test("shows empty spending state without paid entries", async ({
    mockState,
    page,
  }) => {
    mockState.payments = [];

    await page.goto("/spending-history");

    await expect(page.getByText("No paid entries yet.")).toBeVisible();
  });

  test("shows spending error state when payment fetch fails", async ({
    page,
  }) => {
    await page.route("**/rest/v1/payments**", async (route) => {
      await route.fulfill({
        body: JSON.stringify({ message: "Payments service unavailable" }),
        contentType: "application/json",
        status: 500,
      });
    });

    await page.goto("/spending-history");

    await expect(page.getByText(PAYMENTS_ERROR_REGEX)).toBeVisible();
  });

  test("shows spending error state when payment request aborts", async ({
    page,
  }) => {
    await page.route("**/rest/v1/payments**", async (route) => {
      await route.abort("failed");
    });

    await page.goto("/spending-history");

    await expect(page.getByText(PAYMENTS_ABORT_REGEX)).toBeVisible();
  });

  test("renders payment fallbacks and refund failure details", async ({
    mockState,
    page,
  }) => {
    mockState.payments = [
      {
        created_at: "",
        currency: "BAD",
        entry_fee: 5,
        game_id: "unknown-game-id",
        id: 500,
        payment_type: "entry",
        processing_fee: 0.5,
        rebuy_round: 0,
        refund_failure_reason: "bank timeout",
        refund_reason: null,
        refund_requested_at: null,
        refunded_amount: null,
        refunded_at: "invalid-date",
        status: "refund_failed",
        stripe_checkout_session_id: null,
        stripe_payment_intent_id: null,
        stripe_refund_id: null,
        total_amount: 5.5,
        updated_at: "",
        user_id: "user-1",
      },
    ];

    await page.goto("/spending-history");

    await expect(page.getByText("Game unknown-")).toBeVisible();
    await expect(page.getByText("BAD 5.50").first()).toBeVisible();
    await expect(page.getByText("Refunded at: invalid-date")).toBeVisible();
    await expect(page.getByText("Refund error: bank timeout")).toBeVisible();
  });
});
