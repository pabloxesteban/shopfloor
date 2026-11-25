import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const SAMPLE = /Perfiles Quillén, profiles/;

async function extractFirstSample(page: Page) {
  await page.goto("/imports/new");
  await page.getByRole("radio", { name: SAMPLE }).first().check();
  await page.getByRole("button", { name: "Extract selected sample" }).click();
  await expect(page.getByRole("button", { name: "Import to stock" })).toBeVisible();
}

test("demo mode says plainly that only recorded responses can be used", async ({ page }) => {
  await page.goto("/imports/new");
  await expect(page.getByText("No API key on this server, so only recorded responses can be used.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Extract uploaded file" })).toBeDisabled();
});

test("imports a recorded sample after reviewing it", async ({ page }) => {
  await extractFirstSample(page);

  await expect(page.getByText("Demo mode · recorded response")).toBeVisible();
  await expect(page.getByRole("textbox", { name: /^Supplier/ })).toHaveValue(/Quill/);
  await expect(page.getByRole("heading", { name: "Line 1" })).toBeVisible();

  // Check every flagged field the recording produced. A confident recording has none.
  const status = page.getByRole("status").filter({ hasText: /flagged field|confident about every field/ });
  const text = (await status.textContent()) ?? "";
  if (/still need checking/.test(text)) {
    const boxes = page.getByRole("checkbox", { name: /Looks right/ });
    for (const box of await boxes.all()) await box.check();
    await expect(page.getByText("All flagged fields are checked.")).toBeVisible();
  } else {
    await expect(page.getByText("The model was confident about every field.")).toBeVisible();
  }

  await page.getByRole("button", { name: "Import to stock" }).click();
  await expect(page.getByRole("status").filter({ hasText: /^Imported / })).toContainText("added to incoming stock");
  await expect(page.getByRole("table", { name: "Lines added to incoming stock" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View stock" })).toBeVisible();
});

for (const scheme of ["light", "dark"] as const) {
  test.describe(`review state, ${scheme} mode`, () => {
    test.use({ colorScheme: scheme });
    test("has no axe violations", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await extractFirstSample(page);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  });
}
