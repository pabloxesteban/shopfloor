"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { nextStatuses, TRANSITION_LABELS, type OrderStatus } from "@/domain/status";
import { changeStatus } from "../../actions";
import { IDLE } from "../../form-state";

/** Only legal next steps get a button. The server action checks again. */
export function StatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [state, formAction, pending] = useActionState(changeStatus, IDLE);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const options = nextStatuses(status);
  const forward = options.filter((s) => s !== "cancelled");
  const canCancel = options.includes("cancelled");

  return (
    <div>
      {options.length === 0 ? (
        <p className="text-sm text-muted">This order is closed. Its status can no longer change.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {forward.length > 0 ? (
            <form action={formAction} className="contents">
              <input type="hidden" name="orderId" value={orderId} />
              {forward.map((to) => (
                <Button key={to} type="submit" name="to" value={to} variant={to === forward[0] ? "signal" : "secondary"} disabled={pending}>
                  {TRANSITION_LABELS[to]}
                </Button>
              ))}
            </form>
          ) : null}
          {canCancel ? (
            <Button variant="secondary" disabled={pending} onClick={() => setConfirmingCancel(true)}>
              {TRANSITION_LABELS.cancelled}
            </Button>
          ) : null}
        </div>
      )}

      <p
        role="status"
        aria-live="polite"
        className={"mt-3 min-h-5 text-sm " + (state.status === "error" ? "font-medium text-danger" : "text-success")}
      >
        {pending ? "Updating status..." : state.status !== "idle" ? state.message : ""}
      </p>

      <ConfirmDialog
        open={confirmingCancel}
        onClose={() => setConfirmingCancel(false)}
        title={`Cancel ${orderId}?`}
        description="A cancelled order cannot be reopened. The customer and items stay on record."
      >
        <form action={formAction} onSubmit={() => setConfirmingCancel(false)} className="flex justify-end gap-2">
          <input type="hidden" name="orderId" value={orderId} />
          <Button variant="secondary" onClick={() => setConfirmingCancel(false)} autoFocus>
            Keep order
          </Button>
          <Button type="submit" name="to" value="cancelled" variant="danger">
            Cancel order
          </Button>
        </form>
      </ConfirmDialog>
    </div>
  );
}
