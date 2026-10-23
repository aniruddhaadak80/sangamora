import { test, expect } from "@playwright/test";

test("map renders a canvas", async ({ page }) => {
  await page.goto("/map");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Snan'd")).toBeVisible();
});