import { cn } from "./cn";

/** "ARS 8,009,750.00" into the currency code and the number. */
export function splitMoney(formatted: string): [string, string] {
  const [currency = "", ...rest] = formatted.split(/\s| /);
  return [currency, rest.join(" ")];
}

/** A formatted amount with a small currency code. It never breaks across lines, so the code cannot end up alone. */
export function Money({ value, className }: { value: string; className?: string }) {
  const [currency, amount] = splitMoney(value);
  return (
    <span className={cn("whitespace-nowrap", className)}>
      <span className="text-[0.5em] font-medium opacity-70">{currency}</span> {amount}
    </span>
  );
}
