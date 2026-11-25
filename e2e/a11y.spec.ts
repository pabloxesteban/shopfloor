import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = ["/orders", "/orders/ORD-1001", "/stock?low=1", "/imports/new"];

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme });
    for (const path of pages) {
      test(`${path} has no axe violations`, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  });
}

for (const path of pages) {
  test(`${path} fits a 360 px screen without page-level horizontal scroll`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test("keyboard focus is visible on the dark brand band", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/orders");
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate(() => !!document.activeElement?.closest(".brand-band"))) break;
  }
  const focused = page.locator(".brand-band a:focus-visible").first();
  await expect(focused).toBeVisible();
  const outline = await focused.evaluate((el) => getComputedStyle(el).outlineColor);
  expect(outline).toBe("rgb(245, 177, 61)");
});

test("mobile tab bar is visible and never covers the end of the content", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/orders");
  const bar = page.getByRole("navigation", { name: "Main mobile" });
  await expect(bar).toBeVisible();
  // The last row, which is a card on this width: the `tr` that holds the last order link.
  const last = page.locator("main tr").filter({ has: page.locator('a[href^="/orders/ORD-"]') }).last();
  await last.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  // Wait for the scroll to settle before reading boxes.
  await expect
    .poll(async () => {
      const box = await last.boundingBox();
      const barTop = (await bar.boundingBox())?.y ?? 0;
      return box !== null && box.y + box.height <= barTop;
    })
    .toBe(true);
  const rowBox = await last.boundingBox();
  const barBox = await bar.boundingBox();
  expect(rowBox).not.toBeNull();
  expect(barBox).not.toBeNull();
  expect(rowBox!.y + rowBox!.height).toBeLessThanOrEqual(barBox!.y);
});
