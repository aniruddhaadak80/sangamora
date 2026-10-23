import { test, expect } from "@playwright/test";

test("risk grid renders", async ({ page }) => {
  await page.goto("/risk");
  await expect(page.getByRole("heading", { name: "Risk grid" })).toBeVisible();
});