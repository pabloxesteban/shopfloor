"use client";

import { useActionState, useId, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  COLORS,
  GLASS_LABELS,
  GLASS_TYPES,
  PRODUCT_TYPE_LABELS,
  PRODUCT_TYPES,
  SERIES,
} from "@/domain/catalog";
import { formatMoney } from "@/domain/money";
import {
  MAX_ITEMS,
  OrderItemSchema,
  orderEditFromFormData,
  orderEditSchema,
  toFieldErrors,
  type FieldErrors,
  type Order,
} from "@/domain/order";
import { lineTotalCents } from "@/domain/pricing";
import { updateOrder } from "../../actions";
import { IDLE } from "../../form-state";

interface ItemDraft {
  key: string;
  productType: string;
  series: string;
  widthCm: string;
  heightCm: string;
  glass: string;
  color: string;
  quantity: string;
}

let nextKey = 0;
const newKey = () => `item-${++nextKey}`;

function toDraft(item: Order["items"][number]): ItemDraft {
  return {
    key: newKey(),
    productType: item.productType,
    series: item.series,
    widthCm: String(item.widthCm),
    heightCm: String(item.heightCm),
    glass: item.glass,
    color: item.color,
    quantity: String(item.quantity),
  };
}

const BLANK_ITEM: Omit<ItemDraft, "key"> = {
  productType: "sliding-window",
  series: "Modena",
  widthCm: "",
  heightCm: "",
  glass: "single",
  color: "White",
  quantity: "1",
};

/** Live price for a row, or undefined while the row is not valid yet. */
function draftTotal(draft: ItemDraft): number | undefined {
  const parsed = OrderItemSchema.safeParse(draft);
  return parsed.success ? lineTotalCents(parsed.data) : undefined;
}

export function OrderEditForm({ order }: { order: Order }) {
  const [state, formAction, pending] = useActionState(updateOrder, IDLE);
  const [customer, setCustomer] = useState({
    name: order.customer.name,
    phone: order.customer.phone ?? "",
    town: order.customer.town,
  });
  const [priority, setPriority] = useState<string>(order.priority);
  const [dueDate, setDueDate] = useState(order.dueDate);
  const [notes, setNotes] = useState(order.notes ?? "");
  const [items, setItems] = useState<ItemDraft[]>(() => order.items.map(toDraft));
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const colorListId = useId();
  const createdOn = order.createdAt.slice(0, 10);

  const errors: FieldErrors =
    Object.keys(clientErrors).length > 0 ? clientErrors : state.status === "error" ? (state.fieldErrors ?? {}) : {};

  const lineTotals = items.map(draftTotal);
  const estimate = lineTotals.every((t) => t !== undefined)
    ? lineTotals.reduce<number>((sum, t) => sum + (t ?? 0), 0)
    : undefined;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    // Same schema and same FormData reader as the server action.
    const result = orderEditSchema(createdOn).safeParse(orderEditFromFormData(new FormData(event.currentTarget)));
    if (result.success) {
      setClientErrors({});
      return;
    }
    event.preventDefault();
    const fieldErrors = toFieldErrors(result.error);
    setClientErrors(fieldErrors);
    const first = Object.keys(fieldErrors)[0];
    if (first) {
      const target = formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
      target?.focus();
    }
  }

  function updateItem(key: string, patch: Partial<ItemDraft>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function addItem() {
    const key = newKey();
    setItems((current) => [...current, { ...BLANK_ITEM, key }]);
    // Move focus to the new row so keyboard users land where they need to type.
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>(`[data-row="${key}"] select`)?.focus();
    });
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  const clientErrorCount = Object.keys(clientErrors).length;
  const message =
    clientErrorCount > 0
      ? `${clientErrorCount === 1 ? "One field needs" : `${clientErrorCount} fields need`} attention. Nothing was saved.`
      : state.status !== "idle"
        ? state.message
        : "";
  const messageIsError = clientErrorCount > 0 || state.status === "error";

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} noValidate className="space-y-6">
      <input type="hidden" name="orderId" value={order.id} />

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 text-sm font-semibold text-text">Customer and delivery</legend>
        <Field id="customer-name" label="Customer name" error={errors["customer.name"]}>
          <Input
            id="customer-name"
            name="customer.name"
            autoComplete="off"
            value={customer.name}
            error={errors["customer.name"]}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
        </Field>
        <Field id="customer-town" label="Town" error={errors["customer.town"]}>
          <Input
            id="customer-town"
            name="customer.town"
            autoComplete="off"
            value={customer.town}
            error={errors["customer.town"]}
            onChange={(e) => setCustomer({ ...customer, town: e.target.value })}
          />
        </Field>
        <Field id="customer-phone" label="Phone (optional)" error={errors["customer.phone"]}>
          <Input
            id="customer-phone"
            name="customer.phone"
            type="tel"
            autoComplete="off"
            value={customer.phone}
            error={errors["customer.phone"]}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field id="due-date" label="Due date" error={errors.dueDate}>
            <Input
              id="due-date"
              name="dueDate"
              type="date"
              min={createdOn}
              value={dueDate}
              error={errors.dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
          <Field id="priority" label="Priority" error={errors.priority}>
            <Select id="priority" name="priority" value={priority} error={errors.priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </Select>
          </Field>
        </div>
        <Field id="notes" label="Notes (optional)" error={errors.notes} className="sm:col-span-2">
          <Textarea id="notes" name="notes" rows={2} value={notes} error={errors.notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-text">Items</legend>
        {errors.items ? (
          <p id="items-error" className="mb-3 text-sm font-medium text-danger">
            {errors.items}
          </p>
        ) : null}
        <datalist id={colorListId}>
          {COLORS.map((color) => (
            <option key={color} value={color} />
          ))}
        </datalist>
        <ol className="space-y-3">
          {items.map((item, index) => {
            const id = (field: string) => `items-${index}-${field}`;
            const err = (field: string) => errors[`items.${index}.${field}`];
            const total = lineTotals[index];
            return (
              <li key={item.key} data-row={item.key} className="rounded-md border border-border bg-surface-muted/40 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">Item {index + 1}</h3>
                  <div className="flex items-center gap-3">
                    <span className="tabular text-sm font-medium" aria-live="off">
                      {total !== undefined ? formatMoney(total) : "Incomplete"}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={items.length === 1}
                      onClick={() => removeItem(item.key)}
                      aria-label={`Remove item ${index + 1}`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
                  <Field id={id("productType")} label="Product" error={err("productType")} className="col-span-2 lg:col-span-2">
                    <Select
                      id={id("productType")}
                      name={`items.${index}.productType`}
                      value={item.productType}
                      error={err("productType")}
                      onChange={(e) => updateItem(item.key, { productType: e.target.value })}
                    >
                      {PRODUCT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {PRODUCT_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field id={id("series")} label="Series" error={err("series")}>
                    <Select
                      id={id("series")}
                      name={`items.${index}.series`}
                      value={item.series}
                      error={err("series")}
                      onChange={(e) => updateItem(item.key, { series: e.target.value })}
                    >
                      {SERIES.map((series) => (
                        <option key={series} value={series}>
                          {series}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field id={id("glass")} label="Glass" error={err("glass")}>
                    <Select
                      id={id("glass")}
                      name={`items.${index}.glass`}
                      value={item.glass}
                      error={err("glass")}
                      onChange={(e) => updateItem(item.key, { glass: e.target.value })}
                    >
                      {GLASS_TYPES.map((glass) => (
                        <option key={glass} value={glass}>
                          {GLASS_LABELS[glass]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field id={id("widthCm")} label="Width (cm)" error={err("widthCm")}>
                    <Input
                      id={id("widthCm")}
                      name={`items.${index}.widthCm`}
                      inputMode="numeric"
                      value={item.widthCm}
                      error={err("widthCm")}
                      onChange={(e) => updateItem(item.key, { widthCm: e.target.value })}
                    />
                  </Field>
                  <Field id={id("heightCm")} label="Height (cm)" error={err("heightCm")}>
                    <Input
                      id={id("heightCm")}
                      name={`items.${index}.heightCm`}
                      inputMode="numeric"
                      value={item.heightCm}
                      error={err("heightCm")}
                      onChange={(e) => updateItem(item.key, { heightCm: e.target.value })}
                    />
                  </Field>
                  <Field id={id("quantity")} label="Qty" error={err("quantity")}>
                    <Input
                      id={id("quantity")}
                      name={`items.${index}.quantity`}
                      inputMode="numeric"
                      value={item.quantity}
                      error={err("quantity")}
                      onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                    />
                  </Field>
                  <Field id={id("color")} label="Color" error={err("color")} className="col-span-2 md:col-span-1 lg:col-span-2">
                    <Input
                      id={id("color")}
                      name={`items.${index}.color`}
                      list={colorListId}
                      value={item.color}
                      error={err("color")}
                      onChange={(e) => updateItem(item.key, { color: e.target.value })}
                    />
                  </Field>
                </div>
              </li>
            );
          })}
        </ol>
        <Button size="sm" className="mt-3" onClick={addItem} disabled={items.length >= MAX_ITEMS}>
          Add item
        </Button>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted">
          Estimated total{" "}
          <span className="tabular font-semibold text-text" data-testid="estimated-total">
            {estimate !== undefined ? formatMoney(estimate) : "complete all items to see the total"}
          </span>
        </p>
        <div className="flex items-center gap-3">
          <p
            role="status"
            aria-live="polite"
            className={"text-sm " + (messageIsError ? "font-medium text-danger" : "text-success")}
          >
            {pending ? "Saving..." : message}
          </p>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
