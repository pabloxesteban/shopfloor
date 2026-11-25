import { z } from "zod";
import { GlassSchema, ProductTypeSchema, SeriesSchema } from "./catalog";
import { IsoDateSchema, IsoDateTimeSchema } from "./dates";
import { orderTotalCents } from "./pricing";
import { OrderStatusSchema } from "./status";

export const PRIORITIES = ["normal", "urgent"] as const;
export const PrioritySchema = z.enum(PRIORITIES, { error: "Choose a priority" });
export type Priority = z.infer<typeof PrioritySchema>;

export const OrderIdSchema = z.string().regex(/^ORD-\d{4}$/);

/** Empty form fields arrive as "" and mean "not set". */
const optionalText = (schema: z.ZodString) =>
  z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), schema.optional());

export const CustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Customer name needs at least 2 characters" })
    .max(80, { error: "Keep the name under 80 characters" }),
  phone: optionalText(
    z
      .string()
      .trim()
      .regex(/^[0-9+()\s-]{6,20}$/, { error: "Use digits, spaces, dashes or +" }),
  ),
  town: z
    .string()
    .trim()
    .min(2, { error: "Town needs at least 2 characters" })
    .max(60, { error: "Keep the town under 60 characters" }),
});
export type Customer = z.infer<typeof CustomerSchema>;

/**
 * Numbers are coerced so the same schema validates both typed objects and
 * raw form values. An empty string becomes NaN and fails with a clear message.
 */
const wholeNumber = (label: string, min: number, max: number, unit = "") =>
  z.preprocess(
    (value) => (typeof value === "string" ? (value.trim() === "" ? Number.NaN : Number(value)) : value),
    z
      .number({ error: `${label} is required` })
      .int({ error: `${label} must be a whole number` })
      .min(min, { error: `${label} must be at least ${min}${unit}` })
      .max(max, { error: `${label} must be at most ${max}${unit}` }),
  );

export const OrderItemSchema = z.object({
  productType: ProductTypeSchema,
  series: SeriesSchema,
  widthCm: wholeNumber("Width", 20, 600, " cm"),
  heightCm: wholeNumber("Height", 20, 350, " cm"),
  glass: GlassSchema,
  color: z
    .string()
    .trim()
    .min(2, { error: "Color needs at least 2 characters" })
    .max(40, { error: "Keep the color under 40 characters" }),
  quantity: wholeNumber("Quantity", 1, 200),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: OrderIdSchema,
  customer: CustomerSchema,
  status: OrderStatusSchema,
  priority: PrioritySchema,
  items: z.array(OrderItemSchema).min(1),
  createdAt: IsoDateTimeSchema,
  dueDate: IsoDateSchema,
  notes: optionalText(z.string().trim().max(500, { error: "Keep notes under 500 characters" })),
});
export type Order = z.infer<typeof OrderSchema>;

export const MAX_ITEMS = 30;

/**
 * The editable part of an order. Built per order because the due date cannot
 * be earlier than the day the order was created. The client form and the
 * server action both call this with the same argument, so they agree.
 */
export function orderEditSchema(createdOn: string) {
  return z.object({
    customer: CustomerSchema,
    priority: PrioritySchema,
    dueDate: IsoDateSchema.refine((due) => due >= createdOn, {
      error: "Due date cannot be before the order was created",
    }),
    notes: OrderSchema.shape.notes,
    items: z
      .array(OrderItemSchema)
      .min(1, { error: "An order needs at least one item" })
      .max(MAX_ITEMS, { error: `An order can have at most ${MAX_ITEMS} items` }),
  });
}
export type OrderEdit = z.infer<ReturnType<typeof orderEditSchema>>;

export function orderTotal(order: Pick<Order, "items">): number {
  return orderTotalCents(order.items);
}

/**
 * Turns flat form fields (`customer.name`, `items.0.widthCm`, ...) into the
 * nested shape the schema expects. Shared by the client and the server so a
 * form posted without JavaScript is read exactly like one validated in the
 * browser.
 */
export function orderEditFromFormData(formData: FormData): unknown {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };

  const indexes = new Set<number>();
  for (const key of formData.keys()) {
    const match = /^items\.(\d+)\./.exec(key);
    if (match?.[1] !== undefined) indexes.add(Number(match[1]));
  }

  return {
    customer: { name: text("customer.name"), phone: text("customer.phone"), town: text("customer.town") },
    priority: text("priority"),
    dueDate: text("dueDate"),
    notes: text("notes"),
    items: [...indexes]
      .sort((a, b) => a - b)
      .map((i) => ({
        productType: text(`items.${i}.productType`),
        series: text(`items.${i}.series`),
        widthCm: text(`items.${i}.widthCm`),
        heightCm: text(`items.${i}.heightCm`),
        glass: text(`items.${i}.glass`),
        color: text(`items.${i}.color`),
        quantity: text(`items.${i}.quantity`),
      })),
  };
}

export type FieldErrors = Record<string, string>;

/** First message per field path, keyed like the form inputs (`items.0.widthCm`). */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "form";
    errors[key] ??= issue.message;
  }
  return errors;
}
