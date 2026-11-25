// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BUSINESS_TODAY } from "@/domain/dates";
import { DEFAULT_ORDERS_QUERY, ordersHref, quickFilterQuery, type OrdersQuery } from "@/domain/orders-query";
import { FilterBar } from "./filter-bar";

const push = vi.fn();
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));

const renderBar = (patch: Partial<OrdersQuery> = {}) => render(<FilterBar query={{ ...DEFAULT_ORDERS_QUERY, ...patch }} />);

describe("FilterBar", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
  });

  it("writes a status filter to the URL", async () => {
    renderBar();
    await userEvent.click(screen.getByRole("checkbox", { name: /ready/i }));
    expect(push).toHaveBeenCalledWith("/orders?status=ready", { scroll: false });
  });

  it("keeps other filters and resets the page when one changes", async () => {
    renderBar({ status: ["quote"], page: 4 });
    await userEvent.selectOptions(screen.getByLabelText("Priority"), "urgent");
    expect(push).toHaveBeenCalledWith("/orders?status=quote&priority=urgent", { scroll: false });
  });

  it("removes a status that was already selected", async () => {
    renderBar({ status: ["quote", "ready"] });
    expect(screen.getByRole("checkbox", { name: /ready/i })).toBeChecked();
    await userEvent.click(screen.getByRole("checkbox", { name: /ready/i }));
    expect(push).toHaveBeenCalledWith("/orders?status=quote", { scroll: false });
  });

  it("debounces search and replaces the history entry", async () => {
    renderBar();
    await userEvent.type(screen.getByRole("searchbox", { name: "Search" }), "Quilmes");
    // Typing alone has not navigated yet; one replace happens after the pause.
    expect(replace).not.toHaveBeenCalled();
    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
    expect(replace).toHaveBeenCalledWith("/orders?q=Quilmes", { scroll: false });
    expect(push).not.toHaveBeenCalled();
  });

  it("encodes sort and direction from one control", async () => {
    renderBar();
    await userEvent.selectOptions(screen.getByLabelText("Sort by"), "total:asc");
    expect(push).toHaveBeenCalledWith("/orders?sort=total&dir=asc", { scroll: false });
  });

  it("offers to clear filters only when some are active", async () => {
    const { unmount } = renderBar();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    unmount();
    renderBar({ priority: "urgent", sort: "total" });
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(push).toHaveBeenCalledWith("/orders?sort=total", { scroll: false });
  });

  it("links each quick filter chip to its query", () => {
    renderBar();
    expect(screen.getByRole("link", { name: "Past due" })).toHaveAttribute(
      "href",
      ordersHref(quickFilterQuery("past_due", BUSINESS_TODAY)),
    );
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute("href", "/orders");
    for (const name of ["This week", "Urgent", "In production"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("marks All as current by default and keeps More filters closed", () => {
    const { container } = renderBar();
    expect(screen.getByRole("link", { name: "All" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Past due" })).not.toHaveAttribute("aria-current");
    expect(container.querySelector("details")).not.toHaveAttribute("open");
  });

  it("marks the matching chip current and keeps its own fields closed", () => {
    const { container } = render(<FilterBar query={quickFilterQuery("urgent", BUSINESS_TODAY)} />);
    expect(screen.getByRole("link", { name: "Urgent" })).toHaveAttribute("aria-current", "true");
    expect(container.querySelector("details")).not.toHaveAttribute("open");
  });

  it("opens More filters and marks no chip when a manual filter is set", () => {
    const { container } = renderBar({ q: "Sosa" });
    expect(screen.queryAllByRole("link").filter((a) => a.getAttribute("aria-current") === "true")).toHaveLength(0);
    expect(container.querySelector("details")).toHaveAttribute("open");
    expect(screen.getByText("More filters")).toBeInTheDocument();
  });
});
