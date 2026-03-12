import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.*/, { timeout: 5000 });
  });

  test("should have proper heading structure", async ({ page }) => {
    await page.goto("/");
    const heading = page.locator("h1, h2");
    await expect(heading.first()).toBeVisible({ timeout: 5000 });
  });
});
