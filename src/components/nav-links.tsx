"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "./ui/cn";

const LINKS = [
  { href: "/orders", label: "Orders" },
  { href: "/stock", label: "Stock" },
  { href: "/imports/new", label: "Import quote" },
] as const;

function NavList({ pathname }: { pathname?: string }) {
  return (
    <ul className="flex items-center gap-1">
      {LINKS.map((link) => {
        const active = pathname !== undefined && (pathname === link.href || pathname.startsWith(`${link.href}/`));
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center rounded-md px-2.5 text-sm font-medium",
                active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-muted hover:text-text",
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveNavList() {
  return <NavList pathname={usePathname()} />;
}

/**
 * The pathname is URL data, so it is not known while the shared layout is
 * prerendered. The links render right away and the active marker streams in.
 */
export function NavLinks() {
  return (
    <Suspense fallback={<NavList />}>
      <ActiveNavList />
    </Suspense>
  );
}
