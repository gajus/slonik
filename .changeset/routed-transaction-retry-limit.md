---
"slonik": minor
---

fix: `pool.transaction(handler, transactionRetryLimit)` passes `transactionRetryLimit` to the pool returned by a `beforePoolConnection` interceptor.
