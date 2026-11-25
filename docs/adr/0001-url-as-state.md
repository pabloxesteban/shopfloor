# 1. Keep list filters in the URL

Status: accepted

## Context

The orders list has search, a status multi-filter, priority, a due date range, sorting and pagination. People in a workshop share links ("look at the urgent ones due this week") and use the back button. Filter state kept in React state is lost on reload, cannot be shared and does not work with back and forward.

## Decision

All filter, sort and page values live in the URL search params. One module, `src/domain/orders-query.ts`, owns the format: a zod schema parses the params (each field falls back to its default with `.catch()`, so a stale or hand-edited URL never breaks the page) and a serializer writes only the values that differ from the defaults.

The page reads `searchParams` on the server, parses them once and passes the result to both the filter bar and the table. The filter bar never keeps its own copy of the filters. It builds the next URL with `ordersHref()` and navigates; `useOptimistic` shows the new control values while the server renders. Search text is the one exception: it is local while typing and is written to the URL after a short pause with `router.replace`, so Back does not step through every letter.

Any change other than the page number resets to page 1.

## Consequences

- Links are shareable, reload keeps the view, back and forward work. The E2E test checks all three.
- Filtering, sorting and paging happen in the repository, on the server. The browser never holds the full list.
- Every filter change is a server round trip. For 120 rows that is fast; for much larger data the repository query is the place to optimize, not the client.
- The URL format is now a public contract. Renaming a param would break saved links, so the parser is the place to add aliases if that ever happens.
