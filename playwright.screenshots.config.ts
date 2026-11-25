import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/** `pnpm screenshots`: regenerates docs/screenshots/ from the production build. */
export default defineConfig({
  ...base,
  testIgnore: undefined,
  testMatch: "screenshots.spec.ts",
  retries: 0,
});
