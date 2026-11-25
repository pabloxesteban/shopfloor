import { formatDueRelative } from "@/domain/dates";
import { isOpen, type OrderStatus } from "@/domain/status";

/** "Urgent · Due in 3 days". Parts that do not apply are left out, with no dangling separator. */
export function dueLabel(order: { status: OrderStatus; priority: "normal" | "urgent"; dueDate: string }, today: string): string {
  const parts = [
    order.priority === "urgent" ? "Urgent" : "",
    isOpen(order.status) ? formatDueRelative(order.dueDate, today) : "",
  ];
  return parts.filter(Boolean).join(" · ");
}
