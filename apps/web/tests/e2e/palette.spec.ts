import { test, expect } from "@playwright/test";

test("command palette opens on Ctrl+K and navigates", async ({ page }) => {
  await page.goto("/");
  // The Ctrl+K listener is registered in a client useEffect (palette.tsx),
  // so a keypress sent immediately after navigation can be lost before
  // hydration. Retry the shortcut until the palette input appears.
  await expect(async () => {
    await page.keyboard.press("Control+K");
    await expect(page.getByPlaceholder("Search the mela…")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
  await page.getByPlaceholder("Search the mela…").fill("risk");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/risk/);
});