import { expect, test } from "@playwright/test";

test("filters orders through the UI, keeps them in the URL and after a reload", async ({ page }) => {
  await page.goto("/orders");
  const table = page.getByRole("table", { name: /^Orders, / });
  await expect(table).toBeVisible();

  await page.getByRole("checkbox", { name: "Confirmed" }).check();
  await expect(page).toHaveURL(/status=confirmed(&|$)/);
  await page.getByRole("checkbox", { name: "In production" }).check();
  await expect(page).toHaveURL(/status=confirmed%2Cin_production/);
  await page.getByRole("combobox", { name: "Priority" }).selectOption("urgent");
  await expect(page).toHaveURL(/\?status=confirmed%2Cin_production&priority=urgent$/);

  const rows = table.getByRole("row").filter({ has: page.getByRole("link", { name: /^ORD-/ }) });
  await expect(rows.first()).toBeVisible();
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  for (const row of await rows.all()) {
    await expect(row).toContainText(/Confirmed|In production/);
    await expect(row).toContainText("Urgent");
  }
  const ids = await rows.getByRole("link").allTextContents();

  await page.reload();
  await expect(page).toHaveURL(/\?status=confirmed%2Cin_production&priority=urgent$/);
  await expect(page.getByRole("checkbox", { name: "Confirmed" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "In production" })).toBeChecked();
  await expect(page.getByRole("combobox", { name: "Priority" })).toHaveValue("urgent");
  await expect(rows).toHaveCount(count);
  expect(await rows.getByRole("link").allTextContents()).toEqual(ids);

  // Back undoes the last filter change.
  await page.goBack();
  await expect(page).toHaveURL(/\?status=confirmed%2Cin_production$/);
  await expect(page.getByRole("combobox", { name: "Priority" })).toHaveValue("all");
});

test("searches, sorts and paginates on the server", async ({ page }) => {
  await page.goto("/orders?sort=total&dir=desc&page=2");
  await expect(page.getByText("Showing 21 to 40 of 120 orders")).toBeVisible();
  await expect(page.getByRole("table", { name: /^Orders, / }).getByRole("columnheader", { name: /Total/ })).toHaveAttribute("aria-sort", "descending");

  await page.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=3/);
  await expect(page.getByText("Showing 41 to 60 of 120 orders")).toBeVisible();

  await page.getByRole("searchbox", { name: "Search" }).fill("ORD-1042");
  await expect(page).toHaveURL(/q=ORD-1042/);
  await expect(page).not.toHaveURL(/page=/);
  await expect(page.getByRole("link", { name: "ORD-1042" })).toBeVisible();
  await expect(page.getByText("Showing 1 to 1 of 1 orders")).toBeVisible();

  await page.getByRole("searchbox", { name: "Search" }).fill("nobody by this name");
  await expect(page.getByText("No orders match these filters")).toBeVisible();
});
