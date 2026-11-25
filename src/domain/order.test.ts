import { describe, expect, it } from "vitest";
import { orderEditFromFormData, orderEditSchema, toFieldErrors } from "./order";

const validItem = {
  productType: "door",
  series: "A30",
  widthCm: "90",
  heightCm: "210",
  glass: "laminated",
  color: "Black",
  quantity: "1",
};

function formData(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

function itemFields(index: number, item: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(item).map(([key, value]) => [`items.${index}.${key}`, value]));
}

describe("order edit schema", () => {
  const schema = orderEditSchema("2026-10-01");
  const valid = {
    "customer.name": "Lucía Benítez",
    "customer.phone": "",
    "customer.town": "Banfield",
    priority: "urgent",
    dueDate: "2026-11-30",
    notes: "",
    ...itemFields(0, validItem),
  };

  it("parses flat form fields into a typed order edit", () => {
    const result = schema.safeParse(orderEditFromFormData(formData(valid)));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.items[0]?.widthCm).toBe(90);
    expect(result.data.customer.phone).toBeUndefined();
    expect(result.data.notes).toBeUndefined();
  });

  it("keeps item order by index even when fields arrive out of order", () => {
    const data = formData({ ...valid, ...itemFields(3, { ...validItem, color: "White" }) });
    const parsed = schema.parse(orderEditFromFormData(data));
    expect(parsed.items.map((i) => i.color)).toEqual(["Black", "White"]);
  });

  it("reports errors keyed by the input name", () => {
    const result = schema.safeParse(
      orderEditFromFormData(formData({ ...valid, "customer.name": "A", ...itemFields(0, { ...validItem, widthCm: "0" }) })),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    const errors = toFieldErrors(result.error);
    expect(errors["customer.name"]).toMatch(/at least 2/);
    expect(errors["items.0.widthCm"]).toBe("Width must be at least 20 cm");
  });

  it("rejects empty and fractional numbers with readable messages", () => {
    const result = schema.safeParse(
      orderEditFromFormData(formData({ ...valid, ...itemFields(0, { ...validItem, heightCm: "", quantity: "1.5" }) })),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    const errors = toFieldErrors(result.error);
    expect(errors["items.0.heightCm"]).toBe("Height is required");
    expect(errors["items.0.quantity"]).toBe("Quantity must be a whole number");
  });

  it("requires at least one item", () => {
    const withoutItems = Object.fromEntries(Object.entries(valid).filter(([key]) => !key.startsWith("items.")));
    const result = schema.safeParse(orderEditFromFormData(formData(withoutItems)));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toFieldErrors(result.error).items).toBe("An order needs at least one item");
  });

  it("does not allow a due date before the order was created", () => {
    const result = schema.safeParse(orderEditFromFormData(formData({ ...valid, dueDate: "2026-09-30" })));
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toFieldErrors(result.error).dueDate).toMatch(/before the order was created/);
  });

  it("rejects values outside the enums", () => {
    const result = schema.safeParse(
      orderEditFromFormData(formData({ ...valid, priority: "asap", ...itemFields(0, { ...validItem, glass: "triple" }) })),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    const errors = toFieldErrors(result.error);
    expect(errors.priority).toBe("Choose a priority");
    expect(errors["items.0.glass"]).toBe("Choose a glass type");
  });
});
