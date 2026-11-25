import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge, PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BUSINESS_TODAY, formatDate } from "@/domain/dates";
import { isEditable, isOpen, STATUS_LABELS } from "@/domain/status";
import { getOrder } from "@/server/queries";
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

  return (
    <>
      <div className="mb-6">
        <Link href="/orders" className="text-sm text-muted hover:text-text">
          &larr; All orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-xl font-semibold tracking-tight sm:text-2xl">{order.id}</h1>
          <StatusBadge status={order.status} />
          <PriorityBadge priority={order.priority} />
          {overdue ? <Badge tone="danger">Overdue</Badge> : null}
        </div>
        <p className="mt-1 text-sm text-muted">
          {order.customer.name}, {order.customer.town} · created {formatDate(order.createdAt)} · due{" "}
          {formatDate(order.dueDate)}
        </p>
      </div>

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
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="mb-6 h-8 w-64" />
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
