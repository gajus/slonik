---
"@slonik/sql-tag": patch
---

Reuse a single parser instance for `sql.unsafe`

`sql.unsafe` constructed a fresh `z.unknown()` schema on every tagged-template evaluation, i.e. once per query for the most commonly used tag. Zod schema construction is not cheap: in a CPU profile of a steady-state query loop it accounted for roughly 10% of active CPU, spread across `init`, `defineLazy` and schema-class construction, and it was a significant contributor to garbage collection.

The schema carries no per-query state and zod schemas are immutable, so a single module-level instance now serves every token. `parser` is only ever read — it is surfaced to interceptors as `resultParser` — so sharing the instance is not observable.

Measured against PostgreSQL 17 over 60,000 queries at a pool size of 10: CPU per query fell from ~48.6 µs to ~39.1 µs (about 20%), and the garbage-collection share of active CPU fell from 5.8% to 1.2%.
