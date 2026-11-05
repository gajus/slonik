---
"slonik": minor
---

add the `retryLimit` option to `transaction()`, e.g. `pool.transaction(handler, { retryLimit: 3 })`. Passing the retry limit as the second argument (`pool.transaction(handler, 3)`) is deprecated. Also fixes `pool.transaction()` dropping the retry limit when a `beforePoolConnection` interceptor returns another pool: the options are now passed to that pool.
