import { describe, expect, it } from "vitest";
import { dueLabel } from "./due-label";

describe("dueLabel", () => {
  it("prefixes urgent open orders", () => {
    expect(dueLabel({ status: "confirmed", priority: "urgent", dueDate: "2026-03-12" }, "2026-03-10")).toBe("Urgent · Due in 2 days");
  });
  it("shows only the relative text for normal open orders", () => {
    expect(dueLabel({ status: "confirmed", priority: "normal", dueDate: "2026-03-12" }, "2026-03-10")).toBe("Due in 2 days");
  });
  it("has no dangling separator for urgent closed orders", () => {
    expect(dueLabel({ status: "delivered", priority: "urgent", dueDate: "2026-03-01" }, "2026-03-10")).toBe("Urgent");
  });
  it("is empty for normal closed orders", () => {
    expect(dueLabel({ status: "delivered", priority: "normal", dueDate: "2026-03-01" }, "2026-03-10")).toBe("");
  });
});
