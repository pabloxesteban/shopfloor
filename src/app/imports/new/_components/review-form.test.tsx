// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { lowConfidencePaths, type SupplierQuote } from "@/domain/supplier-quote";
import { ReviewForm } from "./review-form";

const c = <T,>(value: T, confidence = 0.95) => ({ value, confidence });

// Hand-built test input for the form. Not model output.
const quote: SupplierQuote = {
  supplier: c("Templados Aguaribay"),
  quoteNumber: c("TA-552", 0.55),
  date: c("2026-11-11"),
  currency: c("ARS" as const),
  total: c(1_877_700),
  lines: [
    {
      description: c("Laminado 4+4"),
      sku: c("GLS-LAM-44"),
      quantity: c(12),
      unit: c("m2" as const),
      unitPrice: c(74_200),
    },
    {
      description: c("Templado 10 mm"),
      sku: c(null, 0.4),
      quantity: c(3.6),
      unit: c("m2" as const),
      unitPrice: c(138_000),
    },
    {
      description: c("Float 6 mm"),
      sku: c("GLS-FLT-6"),
      quantity: c(15),
      unit: c("m2" as const),
      unitPrice: c(32_700),
    },
  ],
};

function setup(input: SupplierQuote = quote) {
  const action = vi.fn();
  render(
    <ReviewForm
      importId="test"
      quote={input}
      flaggedPaths={lowConfidencePaths(input)}
      source="recorded"
      model="test-model"
      documentLabel="Templados Aguaribay"
      action={action}
      pending={false}
      onCancel={() => {}}
    />,
  );
  return {
    action,
    submit: screen.getByRole("button", { name: "Import to stock" }),
  };
}

describe("ReviewForm", () => {
  it("flags only fields under the confidence threshold", () => {
    setup();
    expect(screen.getAllByText(/Check this · \d+% confidence/)).toHaveLength(2);
    expect(screen.getByText("Check this · 55% confidence")).toBeInTheDocument();
    expect(screen.getByText("Check this · 40% confidence")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("2 of 2 flagged fields still need checking");
  });

  it("keeps import disabled until every flagged field is checked", async () => {
    const { submit } = setup();
    expect(submit).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox", { name: /Looks right: Quote number/ }));
    expect(submit).toBeDisabled();
    await userEvent.click(screen.getByRole("checkbox", { name: /Looks right: SKU/ }));
    expect(submit).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("All flagged fields are checked");
  });

  it("counts editing a flagged value as checking it", async () => {
    setup();
    const line2 = screen.getByText("Line 2").closest("li")!;
    await userEvent.type(within(line2).getByLabelText(/^SKU/), "GLS-TMP-10");
    expect(within(line2).getByText("Checked")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("1 of 2 flagged fields still need checking");
  });

  it("shows the demo mode badge for recorded responses", () => {
    setup();
    expect(screen.getByText("Demo mode · recorded response")).toBeInTheDocument();
  });

  it("serializes the reviewed quote and the confirmed paths for the server", async () => {
    setup();
    await userEvent.click(screen.getByRole("checkbox", { name: /Looks right: Quote number/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /Looks right: SKU/ }));
    const hidden = document.querySelector<HTMLInputElement>('input[name="review"]')!;
    const payload = JSON.parse(hidden.value) as {
      importId: string;
      quote: { lines: { sku: string | null }[] };
      confirmedPaths: string[];
    };
    expect(payload.importId).toBe("test");
    expect(payload.quote.lines[1]?.sku).toBeNull();
    expect(payload.confirmedPaths.sort()).toEqual(["lines.1.sku", "quoteNumber"]);
  });

  it("warns when the lines do not add up to the printed total", async () => {
    setup();
    const total = screen.getByLabelText(/Total on document/);
    await userEvent.clear(total);
    await userEvent.type(total, "100");
    expect(screen.getByText(/do not add up to the printed total/)).toBeInTheDocument();
  });

  it("shows a confidence level word next to the flagged text, and High for confident fields", () => {
    setup({ ...quote, supplier: c("Templados Aguaribay", 0.62) });
    const flag = screen.getByText("Check this · 62% confidence");
    const label = flag.closest("label")!;
    expect(within(label).getByText("Low")).toBeInTheDocument();
    const date = screen.getByLabelText(/^Date/).closest("[data-field]") as HTMLElement;
    expect(within(date).getByText("High")).toBeInTheDocument();
  });

  it("labels mid confidence as Check without colour alone", () => {
    setup({ ...quote, date: c("2026-11-11", 0.8) });
    const date = screen.getByLabelText(/^Date/).closest("[data-field]") as HTMLElement;
    expect(within(date).getByText("Check")).toBeInTheDocument();
  });
});
