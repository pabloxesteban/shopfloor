import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">There is nothing at this address.</p>
      <Link href="/orders" className={buttonClasses({ variant: "primary" }) + " mt-6"}>
        Go to orders
      </Link>
    </div>
  );
}
