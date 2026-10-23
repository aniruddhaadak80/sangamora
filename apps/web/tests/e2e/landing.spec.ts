import { test, expect } from "@playwright/test";

test("landing renders the headline", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/sangamora/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("widest");
});

test("nav links to bazaar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Bazaar" }).first().click();
  await expect(page).toHaveURL(/\/bazaar/);
});