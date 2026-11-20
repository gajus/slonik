---
"@slonik/driver": minor
"@slonik/errors": minor
"@slonik/pg-driver": minor
"slonik": minor
---

add `socketTimeout` configuration, which closes a connection if the server does not send any data for that long while a query is in progress, e.g. because a proxy stopped forwarding traffic without closing the connection. The query fails with `SocketTimeoutError` and the pool replaces the connection. The timeout restarts whenever data arrives, so queries and streams that keep returning rows are not closed, and it does not apply while a connection is idle (in the pool, or held between queries) or while a stream waits for its consumer. It is disabled by default.
