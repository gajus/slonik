---
"slonik": patch
---

fix: queries that wait for a connection no longer wait forever when the connections that the pool is establishing fail (e.g. because the database refuses connections) and the pool has no other connections. They fail with the connection error, which is retried according to `connectionRetryLimit`.
