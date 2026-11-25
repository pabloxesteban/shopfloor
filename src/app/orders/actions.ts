"use server";

import { revalidatePath } from "next/cache";
import { formatMoney } from "@/domain/money";
import { orderEditFromFormData, orderEditSchema, OrderIdSchema, orderTotal, toFieldErrors } from "@/domain/order";
import { canTransition, isEditable, OrderStatusSchema, STATUS_LABELS } from "@/domain/status";
import { getRepositories } from "@/server/repository";
import type { FormState } from "./form-state";

/*
 * Server Actions are public POST endpoints. Each one re-reads the order and
 * re-checks every rule the UI already enforced: the UI is a convenience, these
 * checks are the guarantee.
 */

function fail(message: string, fieldErrors?: Record<string, string>): FormState {
  return { status: "error", message, fieldErrors };
}

async function loadOrder(formData: FormData) {
  const id = OrderIdSchema.safeParse(formData.get("orderId"));
  if (!id.success) return undefined;
  return getRepositories().orders.get(id.data);
}

export async function updateOrder(_previous: FormState, formData: FormData): Promise<FormState> {
  const order = await loadOrder(formData);
  if (!order) return fail("This order does not exist.");
  if (!isEditable(order.status)) {
    return fail(`Orders that are ${STATUS_LABELS[order.status].toLowerCase()} can no longer be edited.`);
  }

  const parsed = orderEditSchema(order.createdAt.slice(0, 10)).safeParse(orderEditFromFormData(formData));
  if (!parsed.success) {
    return fail("Some fields need attention. Nothing was saved.", toFieldErrors(parsed.error));
  }

  const saved = await getRepositories().orders.save({ ...order, ...parsed.data });
  revalidatePath(`/orders/${saved.id}`);
  revalidatePath("/orders");
  return { status: "success", message: `Changes saved. Order total is now ${formatMoney(orderTotal(saved))}.` };
}

export async function changeStatus(_previous: FormState, formData: FormData): Promise<FormState> {
  const order = await loadOrder(formData);
  if (!order) return fail("This order does not exist.");

  const to = OrderStatusSchema.safeParse(formData.get("to"));
  if (!to.success) return fail("Unknown status.");
  if (!canTransition(order.status, to.data)) {
    return fail(`An order that is ${STATUS_LABELS[order.status].toLowerCase()} cannot move to ${STATUS_LABELS[to.data].toLowerCase()}.`);
  }

  await getRepositories().orders.save({ ...order, status: to.data });
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/orders");
  return { status: "success", message: `Status changed to ${STATUS_LABELS[to.data].toLowerCase()}.` };
}
