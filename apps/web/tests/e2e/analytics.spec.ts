import { test, expect } from "@playwright/test";

test("analytics renders an svg chart", async ({ page }) => {
  await page.goto("/analytics");
  await expect(page.locator("svg").first()).toBeVisible({ timeout: 10_000 });
});