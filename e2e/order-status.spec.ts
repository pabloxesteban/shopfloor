import { expect, test } from "@playwright/test";

test("moves an order through a legal status transition", async ({ page }) => {
  await page.goto("/orders?status=confirmed");
  const link = page.getByRole("table", { name: /^Orders, / }).getByRole("link", { name: /^ORD-/ }).first();
  const id = (await link.textContent()) ?? "";
  await link.click();
  await expect(page.getByRole("heading", { level: 1, name: id })).toBeVisible();

  const statusCard = page.getByRole("region", { name: "Status" });
  // Only legal next steps are offered for a confirmed order.
  await expect(statusCard.getByRole("button", { name: "Start production" })).toBeVisible();
  await expect(statusCard.getByRole("button", { name: "Cancel order" })).toBeVisible();
  await expect(statusCard.getByRole("button", { name: "Mark as delivered" })).toHaveCount(0);
  await expect(statusCard.getByRole("button", { name: "Mark as ready" })).toHaveCount(0);

  await statusCard.getByRole("button", { name: "Start production" }).click();
  await expect(statusCard.getByRole("status")).toHaveText("Status changed to in production.");
  await expect(statusCard.getByRole("button", { name: "Mark as ready" })).toBeVisible();
  await expect(statusCard.getByRole("button", { name: "Start production" })).toHaveCount(0);
  // Production started, so the order can no longer be edited.
  await expect(page.getByText(/Read only: the order is in production/)).toBeVisible();

  await page.goto(`/orders?q=${id}`);
  await expect(page.getByRole("table", { name: /^Orders, / }).getByRole("row", { name: new RegExp(id) })).toContainText("In production");
});

test("asks for confirmation before cancelling", async ({ page }) => {
  await page.goto("/orders?status=quote");
  await page.getByRole("table", { name: /^Orders, / }).getByRole("link", { name: /^ORD-/ }).last().click();
  const statusCard = page.getByRole("region", { name: "Status" });

  await statusCard.getByRole("button", { name: "Cancel order" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Keep order" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(statusCard.getByRole("button", { name: "Confirm order" })).toBeVisible();

  await statusCard.getByRole("button", { name: "Cancel order" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel order" }).click();
  await expect(statusCard.getByRole("status")).toHaveText("Status changed to cancelled.");
  await expect(statusCard.getByText("This order is closed")).toBeVisible();
});
