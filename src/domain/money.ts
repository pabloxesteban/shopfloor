/** Money is always an integer number of cents. Floats never hold amounts. */
export type Cents = number;

export const CURRENCIES = ["ARS", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

const formatters: Record<Currency, Intl.NumberFormat> = {
  ARS: new Intl.NumberFormat("en-US", { style: "currency", currency: "ARS" }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
};

export function formatMoney(cents: Cents, currency: Currency = "ARS"): string {
  return formatters[currency].format(cents / 100);
}

/** Converts a decimal amount (as printed on a supplier quote) to cents. */
export function toCents(amount: number): Cents {
  return Math.round(amount * 100);
}
