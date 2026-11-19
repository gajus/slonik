---
"@slonik/errors": minor
"slonik": minor
---

add `queueTimeout` configuration, which limits how long a query waits for a connection when the pool is full. Once the timeout elapses, the query fails with `QueueTimeoutError`, which extends `ConnectionError`. The query is not retried: `connectionRetryLimit` applies to establishing a connection. The timeout is disabled by default, i.e. a query waits until a connection becomes available.
