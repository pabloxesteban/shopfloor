"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Input, Select } from "@/components/ui/field";
import { BUSINESS_TODAY } from "@/domain/dates";
import {
  DEFAULT_ORDERS_QUERY,
  QUICK_FILTER_KEYS,
  activeQuickFilter,
  hasActiveFilters,
  ordersHref,
  quickFilterQuery,
  type QuickFilterKey,
  toggleStatus,
  type OrdersQuery,
  type SortField,
} from "@/domain/orders-query";
import { ORDER_STATUSES, STATUS_LABELS } from "@/domain/status";

const SORT_OPTIONS: { value: `${SortField}:${"asc" | "desc"}`; label: string }[] = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "dueDate:asc", label: "Due date, soonest first" },
  { value: "dueDate:desc", label: "Due date, latest first" },
  { value: "total:desc", label: "Total, highest first" },
  { value: "total:asc", label: "Total, lowest first" },
];

const CHIP_LABELS: Record<QuickFilterKey, string> = {
  all: "All",
  past_due: "Past due",
  this_week: "This week",
  urgent: "Urgent",
  in_production: "In production",
};

const SEARCH_DELAY_MS = 350;

/**
 * Every control writes to the URL; the server reads the URL and renders the
 * table. The bar never holds its own copy of the filters except the search
 * text while the user is typing.
 */
export function FilterBar({ query }: { query: OrdersQuery }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Shows the new filter values immediately while the server renders.
  const [current, setCurrent] = useOptimistic(query);
  const [text, setText] = useState(query.q);
  const [syncedQ, setSyncedQ] = useState(query.q);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Back/forward changes the URL under us: take the search text from it.
  if (query.q !== syncedQ) {
    setSyncedQ(query.q);
    setText(query.q);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function navigate(patch: Partial<OrdersQuery>, { replace = false } = {}) {
    const href = ordersHref(current, patch);
    startTransition(() => {
      setCurrent({ ...current, ...patch, page: 1 });
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    });
  }

  function onSearchChange(value: string) {
    setText(value);
    clearTimeout(timer.current);
    // Typing replaces the history entry so Back does not step through every letter.
    timer.current = setTimeout(() => navigate({ q: value.trim() }, { replace: true }), SEARCH_DELAY_MS);
  }

  const activeChip = activeQuickFilter(current, BUSINESS_TODAY);
  // A chip hides the fields it owns. Anything else the user set stays in view.
  const manualFilters = activeChip === null && hasActiveFilters(current);

  return (
    <div className="border-b border-border px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <nav aria-label="Quick filters" className="-mx-1 flex flex-wrap gap-2 px-1">
          {QUICK_FILTER_KEYS.map((key) => {
            const isCurrent = activeChip === key;
            return (
              <Link
                key={key}
                // Chips own their fields and keep only the current sort.
                href={ordersHref({ ...quickFilterQuery(key, BUSINESS_TODAY), sort: current.sort, dir: current.dir })}
                scroll={false}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium transition-colors",
                  isCurrent
                    ? "border-brand bg-brand text-brand-fg"
                    : "border-border-strong bg-surface text-muted hover:border-text hover:text-text",
                )}
              >
                {CHIP_LABELS[key]}
              </Link>
            );
          })}
        </nav>
        <p role="status" aria-live="polite" className="ml-auto text-xs text-muted">
          {isPending ? "Updating results..." : ""}
        </p>
      </div>

      <details open={manualFilters} className="group mt-3">
        <summary className="inline-flex h-8 cursor-pointer list-none items-center gap-1.5 rounded-md text-sm font-medium text-muted hover:text-text [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">
            &#9656;
          </span>
          More filters
        </summary>
        <div className="mt-3 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <form
          role="search"
          className="w-full sm:w-64"
          onSubmit={(event) => {
            event.preventDefault();
            clearTimeout(timer.current);
            navigate({ q: text.trim() });
          }}
        >
          <label htmlFor="orders-search" className="text-xs font-medium text-muted">
            Search
          </label>
          <Input
            id="orders-search"
            type="search"
            placeholder="Customer or order id"
            value={text}
            onChange={(event) => onSearchChange(event.target.value)}
            className="mt-1"
          />
        </form>

        <div className="w-[calc(50%-0.375rem)] sm:w-36">
          <label htmlFor="orders-priority" className="text-xs font-medium text-muted">
            Priority
          </label>
          <Select
            id="orders-priority"
            className="mt-1"
            value={current.priority}
            onChange={(event) => navigate({ priority: event.target.value as OrdersQuery["priority"] })}
          >
            <option value="all">Any priority</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
          </Select>
        </div>

        <div className="w-[calc(50%-0.375rem)] sm:w-40">
          <label htmlFor="orders-due-from" className="text-xs font-medium text-muted">
            Due from
          </label>
          <Input
            id="orders-due-from"
            type="date"
            className="mt-1"
            value={current.dueFrom ?? ""}
            max={current.dueTo}
            onChange={(event) => navigate({ dueFrom: event.target.value || undefined })}
          />
        </div>

        <div className="w-[calc(50%-0.375rem)] sm:w-40">
          <label htmlFor="orders-due-to" className="text-xs font-medium text-muted">
            Due to
          </label>
          <Input
            id="orders-due-to"
            type="date"
            className="mt-1"
            value={current.dueTo ?? ""}
            min={current.dueFrom}
            onChange={(event) => navigate({ dueTo: event.target.value || undefined })}
          />
        </div>

        <div className="w-[calc(50%-0.375rem)] sm:w-52">
          <label htmlFor="orders-sort" className="text-xs font-medium text-muted">
            Sort by
          </label>
          <Select
            id="orders-sort"
            className="mt-1"
            value={`${current.sort}:${current.dir}`}
            onChange={(event) => {
              const [sort, dir] = event.target.value.split(":") as [SortField, "asc" | "desc"];
              navigate({ sort, dir });
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <fieldset className="flex flex-wrap items-center gap-1.5">
          <legend className="sr-only">Status</legend>
          <span aria-hidden="true" className="mr-1 text-xs font-medium text-muted">
            Status
          </span>
          {ORDER_STATUSES.map((status) => {
            const checked = current.status.includes(status);
            return (
              <label key={status} className="relative">
                {/* Transparent input over the whole chip: the chip is the visible control, the input gets the clicks. */}
                <input
                  type="checkbox"
                  className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
                  checked={checked}
                  onChange={() => navigate({ status: toggleStatus(current.status, status) })}
                />
                <span
                  className={
                    "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium " +
                    "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)] " +
                    (checked
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border-strong bg-surface text-muted hover:text-text")
                  }
                >
                  {STATUS_LABELS[status]}
                  {checked ? <span aria-hidden="true">&#10003;</span> : null}
                </span>
              </label>
            );
          })}
        </fieldset>

        {hasActiveFilters(current) ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setText("");
              navigate({ ...DEFAULT_ORDERS_QUERY, sort: current.sort, dir: current.dir });
            }}
          >
            Clear filters
          </Button>
        ) : null}

      </div>
        </div>
      </details>
    </div>
  );
}
