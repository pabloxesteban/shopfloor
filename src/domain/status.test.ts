import { describe, expect, it } from "vitest";
import { canTransition, isEditable, isOpen, nextStatuses, ORDER_STATUSES, stageProgress } from "./status";

describe("order status state machine", () => {
  it("follows the happy path", () => {
    expect(canTransition("quote", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "in_production")).toBe(true);
    expect(canTransition("in_production", "ready")).toBe(true);
    expect(canTransition("ready", "delivered")).toBe(true);
  });

  it("allows cancelling only before the order is ready", () => {
    expect(canTransition("quote", "cancelled")).toBe(true);
    expect(canTransition("confirmed", "cancelled")).toBe(true);
    expect(canTransition("in_production", "cancelled")).toBe(true);
    expect(canTransition("ready", "cancelled")).toBe(false);
    expect(canTransition("delivered", "cancelled")).toBe(false);
  });

  it("does not skip steps or go backwards", () => {
    expect(canTransition("quote", "in_production")).toBe(false);
    expect(canTransition("confirmed", "delivered")).toBe(false);
    expect(canTransition("ready", "in_production")).toBe(false);
    expect(canTransition("in_production", "in_production")).toBe(false);
  });

  it("treats delivered and cancelled as final", () => {
    expect(nextStatuses("delivered")).toEqual([]);
    expect(nextStatuses("cancelled")).toEqual([]);
  });

  it("agrees between nextStatuses and canTransition for every pair", () => {
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        expect(canTransition(from, to)).toBe(nextStatuses(from).includes(to));
      }
    }
  });

  it("knows which statuses are open and editable", () => {
    expect(ORDER_STATUSES.filter(isOpen)).toEqual(["confirmed", "in_production", "ready"]);
    expect(ORDER_STATUSES.filter(isEditable)).toEqual(["quote", "confirmed"]);
  });
});

describe("stageProgress", () => {
  it("maps statuses to a step out of five", () => {
    expect(stageProgress("quote")).toEqual({ step: 0, total: 5, cancelled: false });
    expect(stageProgress("ready")).toEqual({ step: 3, total: 5, cancelled: false });
    expect(stageProgress("delivered")).toEqual({ step: 4, total: 5, cancelled: false });
  });

  it("marks cancelled orders as an empty bar", () => {
    expect(stageProgress("cancelled")).toEqual({ step: -1, total: 5, cancelled: true });
  });
});
