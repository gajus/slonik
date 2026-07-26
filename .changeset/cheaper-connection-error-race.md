---
"slonik": patch
---

Avoid `Promise.race` allocation on every connection checkout

Every pool-level query wrapped its handler in `Promise.race`, so that a connection-level `error` event surfaces immediately instead of leaving the checkout waiting. That guard is needed — without it, an error arriving while no query is in flight is not surfaced at all, which is exactly the `idleInTransactionSessionTimeout` case — but `Promise.race` is an expensive way to express it: it allocates the array, a capability, and a resolve-element closure per entry, on every checkout.

A deferred's `resolve` and `reject` are already idempotent, so forwarding both the routine and the connection error into the same deferred gives identical semantics with materially less machinery. The first settlement wins and later calls are no-ops, so a connection error arriving after the routine has settled is still discarded, and a routine that rejects after a connection error still cannot produce an unhandled rejection.

Measured over 500,000 checkouts: 1,829 B and 237 ns per checkout, down to 1,095 B and 153 ns — roughly 40% fewer bytes and 36% less time. End to end against PostgreSQL 17 at a pool size of 10, CPU per query fell from ~41.5 µs to ~38.7 µs (about 7%), and the `raceError` frame fell from 1.40% to 0.48% of active CPU.
