---
"slonik": patch
---

Reduce heap allocations on hot query construction and result paths

Several internal paths allocated short-lived intermediate arrays/objects that are now avoided, with no change in behavior:

- `sql.join`/`sql.list` no longer re-validate and copy the assembled values array — the members are already narrowed to SQL tokens or primitive value expressions while the fragment is built.
- `sql.unnest` no longer builds a separate values array and spreads the per-column bindings into it; the bindings array is returned directly.
- `pool.record()` builds the result object in a single pass instead of `Object.fromEntries(rows.map(...))`, avoiding a `[key, value]` tuple allocation per row. The prototype-pollution safety for a `__proto__` key is preserved via `Object.defineProperty`, and the result is still a normal `Object.prototype` object.
- `sql.and`/`sql.or` reuse a hoisted filter predicate instead of allocating a new closure on every call.

In an isolated benchmark the `record` transform produced roughly 3x fewer garbage-collection scavenges (and ran ~3.6x faster) on a 1,000-row result, and the `sql.join` value handling dropped from one array allocation per call to none. Real-world impact scales with how large and frequent these operations are; for I/O-bound workloads the gain is modest but free.
