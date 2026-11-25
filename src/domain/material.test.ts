import { describe, expect, it } from "vitest";
import { addIncoming, available, isLow, type Material } from "./material";

const glass: Material = {
  sku: "GLS-LAM-33",
  name: "Laminated glass 3+3",
  category: "glass",
  unit: "m2",
  onHand: 40,
  reserved: 25,
  incoming: 0,
  reorderPoint: 20,
};

describe("stock math", () => {
  it("available is on hand minus reserved", () => {
    expect(available(glass)).toBe(15);
  });

  it("is low when available plus incoming is under the reorder point", () => {
    expect(isLow(glass)).toBe(true);
    expect(isLow({ ...glass, incoming: 5 })).toBe(false);
    expect(isLow({ ...glass, incoming: 4.5 })).toBe(true);
  });

  it("can go negative when more is reserved than on hand", () => {
    expect(available({ ...glass, reserved: 50 })).toBe(-10);
    expect(isLow({ ...glass, reserved: 50 })).toBe(true);
  });

  it("adds incoming without floating point noise", () => {
    expect(addIncoming({ ...glass, incoming: 0.1 }, 0.2).incoming).toBe(0.3);
  });
});
