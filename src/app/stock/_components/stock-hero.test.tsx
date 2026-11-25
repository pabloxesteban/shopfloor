// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StockHero, stockHeroLabel } from "./stock-hero";

describe("stockHeroLabel", () => {
  it("handles zero, one and many", () => {
    expect(stockHeroLabel(0)).toBe("All materials above reorder point");
    expect(stockHeroLabel(1)).toBe("material below reorder point");
    expect(stockHeroLabel(4)).toBe("materials below reorder point");
  });
});

describe("StockHero", () => {
  it("shows the figure with its label", () => {
    render(<StockHero lowCount={4} />);
    expect(screen.getByText("4")).toBeTruthy();
    expect(screen.getByText("materials below reorder point")).toBeTruthy();
  });
  it("shows only the sentence at zero", () => {
    render(<StockHero lowCount={0} />);
    expect(screen.getByText("All materials above reorder point")).toBeTruthy();
    expect(screen.queryByText("0")).toBeNull();
  });
});
