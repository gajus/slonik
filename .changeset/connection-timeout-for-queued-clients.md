---
"slonik": minor
---

fix: `connectionTimeout` also limits how long a client waits for a connection when the pool is full. Previously, a client that was queued waited until a connection became available, however long that took. Now the client is removed from the queue and the connection attempt fails with `ConnectionError` once `connectionTimeout` elapses; like other connection failures, it is retried according to `connectionRetryLimit`. Use `connectionTimeout: 'DISABLE_TIMEOUT'` to wait without a limit.
