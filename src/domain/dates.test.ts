import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatDate, formatDueRelative, startOfMonth, startOfWeek } from "./dates";

describe("dates", () => {
  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("finds the Monday of the week", () => {
    expect(startOfWeek("2026-11-18")).toBe("2026-11-16"); // Wednesday
    expect(startOfWeek("2026-11-16")).toBe("2026-11-16"); // Monday
    expect(startOfWeek("2026-11-22")).toBe("2026-11-16"); // Sunday
  });

  it("computes month start and day differences", () => {
    expect(startOfMonth("2026-11-18")).toBe("2026-11-01");
    expect(daysBetween("2026-11-01", "2026-11-18")).toBe(17);
  });

  it("formats in UTC regardless of the machine time zone", () => {
    expect(formatDate("2026-11-01")).toBe("1 Nov 2026");
  });
});

describe("formatDueRelative", () => {
  const today = "2026-11-18";
  it("describes upcoming and late dates", () => {
    expect(formatDueRelative("2026-11-18", today)).toBe("Due today");
    expect(formatDueRelative("2026-11-19", today)).toBe("Due tomorrow");
    expect(formatDueRelative("2026-11-21", today)).toBe("Due in 3 days");
    expect(formatDueRelative("2026-11-17", today)).toBe("1 day late");
    expect(formatDueRelative("2026-11-08", today)).toBe("10 days late");
  });
});
