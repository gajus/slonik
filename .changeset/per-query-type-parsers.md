---
"@slonik/driver": minor
"@slonik/pg-driver": minor
"@slonik/sql-tag": minor
"@slonik/types": minor
"slonik": minor
"slonik-interceptor-query-cache": minor
---

add per-query type parsers: set `typeParsers` on a query to override the pool's type parsers for that query only, e.g. `pool.one({ ...query, typeParsers: [{ name: "numeric", parse: (value) => value }] })`. `slonik-interceptor-query-cache` does not cache queries that use per-query type parsers.
