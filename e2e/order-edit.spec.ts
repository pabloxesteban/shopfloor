import { expect, test } from "@playwright/test";

test("edits an order, shows a validation error, then saves and updates the total", async ({ page }) => {
  await page.goto("/orders?status=quote");
  await page.getByRole("table", { name: /^Orders, / }).getByRole("link", { name: /^ORD-/ }).first().click();
  await expect(page.getByRole("heading", { level: 1, name: /^ORD-/ })).toBeVisible();

  const form = page.getByRole("region", { name: "Edit order" });
  const width = form.getByRole("textbox", { name: "Width (cm)" }).first();
  const quantity = form.getByRole("textbox", { name: "Qty" }).first();
  const status = form.getByRole("status");
  const originalTotal = await page.getByTestId("order-total").textContent();

  // Invalid width: blocked in the browser with a message next to the field.
  await width.fill("5");
  await form.getByRole("button", { name: "Save changes" }).click();
  await expect(form.getByText("Width must be at least 20 cm")).toBeVisible();
  await expect(width).toHaveAttribute("aria-invalid", "true");
  await expect(width).toBeFocused();
  await expect(status).toContainText("needs attention");
  await expect(page.getByTestId("order-total")).toHaveText(originalTotal ?? "");

  // Fix it and change the quantity so the total has to move.
  await width.fill("180");
  await quantity.fill("7");
  await expect(form.getByText("Width must be at least 20 cm")).toBeVisible(); // stays until the next submit
  const estimate = await form.getByTestId("estimated-total").textContent();
  await form.getByRole("button", { name: "Save changes" }).click();

  await expect(status).toContainText(`Changes saved. Order total is now ${estimate}.`);
  await expect(page.getByTestId("order-total")).toHaveText(estimate ?? "");
  expect(estimate).not.toBe(originalTotal);
  await expect(form.getByText("Width must be at least 20 cm")).toBeHidden();
  await expect(width).toHaveValue("180");

  // The saved data survives a full reload.
  await page.reload();
  await expect(page.getByTestId("order-total")).toHaveText(estimate ?? "");
});
