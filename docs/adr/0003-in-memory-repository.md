# 3. In-memory repository behind an interface

Status: accepted

## Context

This is a concept project. It needs realistic data (about 120 orders over six months, about 30 materials, some low on stock) without asking anyone who clones it to run a database.

## Decision

`src/server/repository.ts` defines `OrderRepository` and `MaterialRepository`. The only implementation keeps data in memory and is seeded on first use from a seeded random generator (`src/server/data/prng.ts`) and a fixed "today" (`BUSINESS_TODAY` in `src/domain/dates.ts`). The same seed always produces the same data, so tests, screenshots and links are stable.

There is one store per server process. It is kept on `globalThis` because Next.js can load a module more than once (dev reloads, separate bundles), and all copies must see the same data. Pages read through `src/server/queries.ts`, which calls `io()` so the in-memory reads count as request-time data and are not baked into the build.

## Consequences

- Clone, install, run. No database, no migrations, no credentials.
- **State resets when the server restarts.** Edits, status changes and imports are lost. This is stated in the README and on the order not-found page.
- The store is not shared between server instances, so this cannot run on more than one instance or on serverless platforms that spin up many. It is meant for local use and demos.
- A Postgres implementation would implement the same two interfaces. Filtering, sorting and pagination would move into SQL. Pages, actions and the domain would not change. That implementation is not built.
