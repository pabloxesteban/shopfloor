import { describe, expect, it } from "vitest";
import { dueLine } from "./due-line";

const today = "2026-11-18";

describe("dueLine", () => {
  it("shows the relative text and the date for open orders", () => {
    expect(dueLine("confirmed", "2026-11-20", today)).toEqual({ text: "Due in 2 days", date: "20 Nov 2026" });
  });
  it("does the same for quotes", () => {
    expect(dueLine("quote", "2026-11-20", today)).toEqual({ text: "Due in 2 days", date: "20 Nov 2026" });
  });
  it("shows the date once for delivered and cancelled orders", () => {
    expect(dueLine("delivered", "2026-11-10", today)).toEqual({ text: "Due 10 Nov 2026", date: null });
    expect(dueLine("cancelled", "2026-11-10", today)).toEqual({ text: "Due 10 Nov 2026", date: null });
  });
});
