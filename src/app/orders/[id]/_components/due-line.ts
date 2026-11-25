import { formatDate, formatDueRelative } from "@/domain/dates";
import type { OrderStatus } from "@/domain/status";

/**
 * Due text for the order header. Orders that can still change (quotes and open orders) read as
 * "Due in 3 days" with the date in brackets. Delivered and cancelled orders only name the date.
 */
export function dueLine(status: OrderStatus, dueDate: string, today: string): { text: string; date: string | null } {
  if (status === "delivered" || status === "cancelled") return { text: `Due ${formatDate(dueDate)}`, date: null };
  return { text: formatDueRelative(dueDate, today), date: formatDate(dueDate) };
}
