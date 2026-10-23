import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("landing has no critical a11y violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});