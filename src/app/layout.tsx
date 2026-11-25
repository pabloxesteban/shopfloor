import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { ConceptBadge } from "@/components/concept-badge";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { NavLinks } from "@/components/nav-links";
import { ThemeToggle, themeScript } from "@/components/theme-toggle";
import { buttonClasses } from "@/components/ui/button";
import { BUSINESS_TODAY, formatDate } from "@/domain/dates";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-jb" });

export const metadata: Metadata = {
  title: { default: "Shopfloor", template: "%s · Shopfloor" },
  description:
    "Operations dashboard for a fictional aluminum window and door workshop. Concept project with fictional data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${archivo.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
        >
          Skip to content
        </a>
        <header className="brand-band bg-brand text-brand-fg">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 sm:px-6">
            <Link href="/orders" className="flex items-baseline gap-3">
              <span className="display text-[28px] leading-none">Shopfloor</span>
              <span className="hidden text-sm text-brand-muted sm:inline">Frame &amp; Pane Co.</span>
            </Link>
            <nav aria-label="Main" className="hidden sm:block">
              <NavLinks />
            </nav>
            <div className="order-last w-full sm:order-none sm:ml-auto sm:w-auto">
              <ConceptBadge />
            </div>
            <div className="ml-auto flex items-center gap-3 sm:ml-0">
              <ThemeToggle />
              <Link href="/imports/new" className={`${buttonClasses({ variant: "signal" })} hidden sm:inline-flex`}>
                Import supplier quote
              </Link>
            </div>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-border pb-20 sm:pb-0">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4 py-4 text-xs text-muted sm:px-6">
            <p>Frame &amp; Pane Co. is a fictional workshop. All names, orders and numbers are generated.</p>
            <p>
              Data as of <time dateTime={BUSINESS_TODAY}>{formatDate(BUSINESS_TODAY)}</time>
            </p>
          </div>
        </footer>
        <MobileTabBar />
      </body>
    </html>
  );
}
