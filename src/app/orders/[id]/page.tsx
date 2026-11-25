import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BrandBand } from "@/components/brand-band";
import { Card, CardHeader } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { StageBar } from "@/components/ui/stage-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { BUSINESS_TODAY, formatDate } from "@/domain/dates";
import { formatMoney } from "@/domain/money";
import { orderTotalCents } from "@/domain/pricing";
import { isEditable, isOpen, STATUS_LABELS } from "@/domain/status";
import { getOrder } from "@/server/queries";
import { dueLine } from "./_components/due-line";
import { ItemsTable } from "./_components/items-table";
import { OrderEditForm } from "./_components/order-edit-form";
import { StatusActions } from "./_components/status-actions";

export async function generateMetadata({ params }: PageProps<"/orders/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: id.toUpperCase() };
}

async function OrderDetail({ params }: { params: PageProps<"/orders/[id]">["params"] }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const overdue = isOpen(order.status) && order.dueDate < BUSINESS_TODAY;
  const due = dueLine(order.status, order.dueDate, BUSINESS_TODAY);

  return (
    <>
      <BrandBand label="Order summary">
        <Link href="/orders" className="rounded-md text-sm text-brand-muted underline-offset-4 hover:text-brand-fg hover:underline">
          &larr; All orders
        </Link>
        <div className="mt-4 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-10">
          <div className="min-w-0">
            <h1 className="display text-2xl break-words sm:text-3xl">
              <span className="font-mono text-xl font-semibold tracking-tight sm:text-2xl">{order.id}</span>{" "}
              <span>{order.customer.name}</span>
            </h1>
            <p className="mt-1 text-sm text-brand-muted">
              {order.customer.town} · created {formatDate(order.createdAt)}
              {order.priority === "urgent" ? " · Urgent" : ""}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
              <StageBar status={order.status} size="lg" onBrand />
              <p className="flex items-center gap-2 text-base">
                {overdue ? <span aria-hidden="true" className="size-2.5 rounded-full bg-signal" /> : null}
                <span>{due.text}</span>
                {due.date ? <span className="text-brand-muted">({due.date})</span> : null}
              </p>
            </div>
          </div>
          <div className="sm:text-right">
            <p className="display tabular text-4xl leading-none sm:text-[56px]">
              <Money value={formatMoney(orderTotalCents(order.items))} />
            </p>
            <p className="mt-1.5 text-sm text-brand-muted">Order total</p>
          </div>
        </div>
      </BrandBand>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card aria-labelledby="items-title">
            <CardHeader id="items-title" title="Items" description="Prices are computed from size, series and glass." />
            <ItemsTable items={order.items} />
          </Card>

          <Card aria-labelledby="edit-title">
            <CardHeader
              id="edit-title"
              title="Edit order"
              description={
                isEditable(order.status)
                  ? "Changes are checked here and again on the server."
                  : `Read only: the order is ${STATUS_LABELS[order.status].toLowerCase()}.`
              }
            />
            <div className="px-4 py-4 sm:px-5">
              {isEditable(order.status) ? (
                <OrderEditForm key={order.id} order={order} />
              ) : (
                <p className="text-sm text-muted">
                  Items and customer details can change while the order is a quote or confirmed. Once production starts the
                  order is fixed.
                </p>
              )}
            </div>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card aria-labelledby="status-title">
            <CardHeader id="status-title" title="Status" description="Quote, confirmed, in production, ready, delivered." />
            <div className="px-4 py-4 sm:px-5">
              <StatusActions orderId={order.id} status={order.status} />
            </div>
          </Card>

          <Card aria-labelledby="customer-title">
            <CardHeader id="customer-title" title="Customer" />
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-4 py-4 text-sm sm:px-5">
              <dt className="text-muted">Name</dt>
              <dd>{order.customer.name}</dd>
              <dt className="text-muted">Town</dt>
              <dd>{order.customer.town}</dd>
              <dt className="text-muted">Phone</dt>
              <dd className="tabular">{order.customer.phone ?? "Not given"}</dd>
              <dt className="text-muted">Notes</dt>
              <dd>{order.notes ?? "None"}</dd>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading order">
      <Skeleton className="mb-6 h-40 rounded-lg" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-lg lg:col-span-2" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

export default function OrderPage({ params }: PageProps<"/orders/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}
