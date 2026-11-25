import { expect, test } from "@playwright/test";

test("demo mode says plainly when a sample has no recorded response", async ({ page }) => {
  await page.goto("/imports/new");
  await expect(page.getByText(/Demo mode · no API key/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Extract uploaded file" })).toBeDisabled();

  await page.getByRole("radio", { name: /Importadora Lapacho/ }).check();
  await page.getByRole("button", { name: "Extract selected sample" }).click();
  const alert = page.getByRole("main").getByRole("alert");
  await expect(alert).toContainText("No recorded response for this sample yet");
  await expect(alert).toContainText("pnpm ai:record");
});

test.skip("imports a recorded sample after reviewing flagged fields", async () => {
  // Skipped on purpose: fixtures/recorded/ is empty until `pnpm ai:record`
  // has been run with a real API key. Recorded responses must come from the
  // model, so this test waits for real recordings instead of using made-up ones.
});
