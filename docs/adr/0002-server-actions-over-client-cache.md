# 2. Server Components and Server Actions instead of a client data cache

Status: accepted

## Context

A common setup for a dashboard like this is a JSON API plus TanStack Query (or SWR) in the browser: the client fetches, caches, and invalidates after mutations. That brings a second source of truth (the client cache), loading and error states for every query, and cache keys to keep in sync with the server.

## Decision

Pages are Server Components that read from the repository directly. Mutations (edit order, change status, import a quote) are Server Actions called from forms with `useActionState`. After a mutation the action calls `revalidatePath`, and the framework sends back the updated UI in the same round trip.

Expected failures (validation errors, illegal status changes) are returned as values (`FormState`) and shown inline. Unexpected ones throw and reach the route's `error.tsx`.

TanStack Query is not used. There is no client-side data that outlives a page, no polling and no offline need, which are the cases where a client cache pays for itself.

## Consequences

- One source of truth: the server. No cache keys, no manual invalidation in the browser.
- Forms work before JavaScript loads (progressive enhancement), because they are real forms with server actions.
- Every action is a public POST endpoint, so each one re-validates its input with the same zod schema the form uses and re-checks business rules (for example `canTransition`) on the server.
- If the app later needs live updates or heavy client interaction (drag and drop planning, for example), a client cache for that part would be reasonable. It would sit next to this approach, not replace it.
