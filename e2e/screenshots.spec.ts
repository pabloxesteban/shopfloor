import { expect, test, type Page } from "@playwright/test";

const DIR = "docs/screenshots";

async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
}

test.use({ viewport: { width: 1440, height: 1000 } });

test("orders, light", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByRole("table", { name: /^Orders, / })).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${DIR}/orders-light.png`, fullPage: true });
});

test.describe("dark", () => {
  test.use({ colorScheme: "dark" });
  test("orders filtered, dark", async ({ page }) => {
    await page.goto("/orders?status=confirmed%2Cin_production%2Cready&sort=dueDate&dir=asc");
    await expect(page.getByRole("table", { name: /^Orders, / })).toBeVisible();
    await settle(page);
    await page.screenshot({ path: `${DIR}/orders-dark.png`, fullPage: true });
  });
});

test("order detail with a validation error", async ({ page }) => {
  await page.goto("/orders?status=quote");
  await page.getByRole("table", { name: /^Orders, / }).getByRole("link", { name: /^ORD-/ }).first().click();
  const form = page.getByRole("region", { name: "Edit order" });
  await form.getByRole("textbox", { name: "Width (cm)" }).first().fill("5");
  await form.getByRole("button", { name: "Save changes" }).click();
  await expect(form.getByText("Width must be at least 20 cm")).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${DIR}/order-detail.png`, fullPage: true });
});

test("stock", async ({ page }) => {
  await page.goto("/stock");
  await expect(page.getByRole("heading", { name: /Low stock/ })).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${DIR}/stock.png`, fullPage: true });
});

test("import, choosing a recorded sample", async ({ page }) => {
  await page.goto("/imports/new");
  await expect(page.getByRole("button", { name: "Extract selected sample" })).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${DIR}/import-demo.png`, fullPage: true });
});

test("import, review screen", async ({ page }) => {
  await page.goto("/imports/new");
  await page.getByRole("radio", { name: /Perfiles Quillén, profiles/ }).check();
  await page.getByRole("button", { name: "Extract selected sample" }).click();
  await expect(page.getByRole("button", { name: "Import to stock" })).toBeVisible();
  await settle(page);
  await page.screenshot({ path: `${DIR}/import-review.png`, fullPage: true });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test("orders on a phone", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByRole("table", { name: /^Orders, / })).toBeVisible();
    await settle(page);
    await page.screenshot({ path: `${DIR}/orders-mobile.png` });
  });
});
