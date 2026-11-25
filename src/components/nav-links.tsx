"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "./ui/cn";

const LINKS = [
  { href: "/orders", label: "Orders" },
  { href: "/stock", label: "Stock" },
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
                "inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors duration-150",
                active ? "bg-brand-2 text-brand-fg" : "text-brand-muted hover:bg-brand-2/60 hover:text-brand-fg",
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
