import type { ReactNode } from "react";
import { cn } from "./cn";

export function Card({ className, children, ...props }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface", className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, description, actions, id }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <h2 id={id} className="text-sm font-semibold text-text">
          {title}
        </h2>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
