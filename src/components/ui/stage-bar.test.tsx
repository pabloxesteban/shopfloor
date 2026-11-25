// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StageBar } from "./stage-bar";

function segments(container: HTMLElement) {
  return Array.from(container.querySelectorAll("[data-segment]"));
}

describe("StageBar", () => {
  it("shows the status as real text and fills three segments for in production", () => {
    const { container } = render(<StageBar status="in_production" />);
    expect(screen.getByText("In production")).toBeTruthy();
    const all = segments(container);
    expect(all).toHaveLength(5);
    expect(all.filter((s) => s.getAttribute("data-filled") === "true")).toHaveLength(3);
  });

  it("shows an empty bar and Cancelled text for cancelled orders", () => {
    const { container } = render(<StageBar status="cancelled" />);
    expect(screen.getByText("Cancelled")).toBeTruthy();
    const all = segments(container);
    expect(all).toHaveLength(5);
    expect(all.filter((s) => s.getAttribute("data-filled") === "true")).toHaveLength(0);
  });

  it("always renders five segments and hides them from assistive tech", () => {
    const { container } = render(<StageBar status="quote" size="lg" />);
    expect(segments(container)).toHaveLength(5);
    expect(container.querySelector('[aria-hidden="true"]')?.querySelectorAll("[data-segment]")).toHaveLength(5);
    expect(container.querySelector('[role="img"]')).toBeNull();
  });
});
