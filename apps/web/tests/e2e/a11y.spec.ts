import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// axe walks the whole landing page (canvas + animated sections), which is
// heavier than a normal assertion and regularly brushes the default 30s budget
// on shared runners. Disable motion so the scan sees a settled page, and give
// the scan its own budget.
test("landing has no critical a11y violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical).toEqual([]);
});
test.setTimeout(90_000);
