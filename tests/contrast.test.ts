import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

function block(opener: string): string {
  const start = css.indexOf(opener);
  if (start === -1) throw new Error(`Missing block: ${opener}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

function tokens(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1] as string] = m[2] as string;
  return out;
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const PAIRS: [string, string][] = [
  ["text", "bg"],
  ["text", "surface"],
  ["text-muted", "bg"],
  ["text-muted", "surface"],
  ["accent", "surface"],
  ["signal-ink", "surface"],
  ["brand-fg", "brand"],
  ["brand-muted", "brand"],
  ["signal-fg", "signal"],
];

const THEMES: Record<string, Record<string, string>> = {
  light: tokens(block(":root {")),
  "dark (data-theme)": tokens(block(':root[data-theme="dark"]')),
  "dark (prefers-color-scheme)": tokens(block(':root:not([data-theme="light"])')),
};

describe("palette contrast (WCAG AA 4.5:1)", () => {
  for (const [theme, t] of Object.entries(THEMES)) {
    describe(theme, () => {
      for (const [fg, bg] of PAIRS) {
        if (!(fg in t) || !(bg in t)) continue;
        it(`${fg} on ${bg}`, () => {
          expect(ratio(t[fg] as string, t[bg] as string)).toBeGreaterThanOrEqual(4.5);
        });
      }
    });
  }

  it("covers every pair in the light theme", () => {
    for (const [fg, bg] of PAIRS) {
      expect(THEMES.light, `${fg} / ${bg}`).toHaveProperty(fg);
      expect(THEMES.light).toHaveProperty(bg);
    }
  });

  it("keeps both dark blocks identical", () => {
    expect(THEMES["dark (prefers-color-scheme)"]).toEqual(THEMES["dark (data-theme)"]);
  });

  it("no longer defines status colour tokens", () => {
    expect(css).not.toMatch(/--st-/);
  });
});
