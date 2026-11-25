"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function OrdersError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-md rounded-lg border border-border bg-surface p-6 text-center">
      <h2 className="text-base font-semibold">Orders could not be loaded</h2>
      <p className="mt-2 text-sm text-muted">Something went wrong on our side. Your filters are still in the address bar.</p>
      <Button variant="primary" className="mt-4" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
