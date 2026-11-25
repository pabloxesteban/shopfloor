import type { FieldErrors } from "@/domain/order";

/** What every form action returns. Expected failures are values, not exceptions. */
export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: FieldErrors };

export const IDLE: FormState = { status: "idle" };
