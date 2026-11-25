"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "./ui/cn";

const TABS = [
  { href: "/orders", label: "Orders" },
  { href: "/stock", label: "Stock" },
] as const;

function isActive(pathname: string | undefined, href: string) {
  return pathname !== undefined && (pathname === href || pathname.startsWith(`${href}/`));
}

function TabList({ pathname }: { pathname?: string }) {
  return (
    <ul className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2">
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <li key={tab.href} className="flex-1">
            <Link
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-12 items-center justify-center rounded-lg text-sm font-medium transition-colors duration-150",
                active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-muted hover:text-text",
              )}
            >
              {tab.label}
            </Link>
          </li>
        );
      })}
      <li className="flex-1">
        <Link
          href="/imports/new"
          aria-current={isActive(pathname, "/imports/new") ? "page" : undefined}
          className="flex h-12 items-center justify-center rounded-lg border border-transparent bg-signal text-sm font-medium text-signal-fg transition-colors duration-150 hover:brightness-95"
        >
          Import
        </Link>
      </li>
    </ul>
  );
}

function ActiveTabList() {
  return <TabList pathname={usePathname()} />;
}

/** Fixed to the bottom of small screens. The layout pads <main> so it never covers content. */
export function MobileTabBar() {
  return (
    <nav aria-label="Main mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface sm:hidden">
      <Suspense fallback={<TabList />}>
        <ActiveTabList />
      </Suspense>
    </nav>
  );
}
