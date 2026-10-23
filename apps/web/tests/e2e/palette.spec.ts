import { test, expect } from "@playwright/test";

test("command palette opens on Ctrl+K and navigates", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+K");
  await page.getByPlaceholder("Search the mela…").fill("risk");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/risk/);
});