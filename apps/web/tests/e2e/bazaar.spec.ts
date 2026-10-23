import { test, expect } from "@playwright/test";

test("bazaar shows rupee prices", async ({ page }) => {
  await page.goto("/bazaar");
  await expect(page.getByText("₹", { exact: false }).first()).toBeVisible();
});