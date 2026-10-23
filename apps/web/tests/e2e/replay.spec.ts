import { test, expect } from "@playwright/test";

test("replay mentions same seed", async ({ page }) => {
  await page.goto("/replay");
  await expect(page.getByText(/same seed/i)).toBeVisible();
});