import { z } from "zod";

export const ORDER_STATUSES = [
  "quote",
  "confirmed",
  "in_production",
  "ready",
  "delivered",
  "cancelled",
] as const;
export const OrderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const STATUS_LABELS: Record<OrderStatus, string> = {
  quote: "Quote",
  confirmed: "Confirmed",
  in_production: "In production",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Label for the button that moves an order into a status. */
export const TRANSITION_LABELS: Record<OrderStatus, string> = {
  quote: "Back to quote",
  confirmed: "Confirm order",
  in_production: "Start production",
  ready: "Mark as ready",
  delivered: "Mark as delivered",
  cancelled: "Cancel order",
};

const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  quote: ["confirmed", "cancelled"],
  confirmed: ["in_production", "cancelled"],
  in_production: ["ready", "cancelled"],
  ready: ["delivered"],
  delivered: [],
  cancelled: [],
};

export function nextStatuses(status: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[status];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Orders the workshop still has to deliver. Quotes are not commitments yet. */
export function isOpen(status: OrderStatus): boolean {
  return status === "confirmed" || status === "in_production" || status === "ready";
}

/** Items can change until production starts. After that the order is fixed. */
export function isEditable(status: OrderStatus): boolean {
  return status === "quote" || status === "confirmed";
}
