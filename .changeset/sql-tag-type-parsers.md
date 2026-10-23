---
"@slonik/driver": minor
"@slonik/pg-driver": minor
"@slonik/sql-tag": minor
"@slonik/types": minor
"slonik": minor
"slonik-interceptor-query-cache": minor
---

add `typeParsers` option to `createSqlTag`: queries created by the tag override the pool's type parsers for the types they name, e.g. `createSqlTag({ typeParsers: [{ name: "numeric", parse: (value) => value }] })`. `slonik-interceptor-query-cache` does not cache queries that override type parsers.
