import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function OrderNotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-semibold">Order not found</h1>
      <p className="mt-2 text-sm text-muted">
        There is no order with that id. It may have been typed wrong, or the demo data was reset when the server restarted.
      </p>
      <Link href="/orders" className={buttonClasses({ variant: "primary" }) + " mt-6"}>
        Back to orders
      </Link>
    </div>
  );
}
