---
"@slonik/sql-tag": major
"slonik": major
---

Replaced `any` with `unknown` for `sql.unsafe` query results. `sql.unsafe` now uses `z.unknown()` instead of `z.any()`, and the default `QuerySqlToken` generic is `StandardSchemaV1<unknown, unknown>`. This forces consumers to narrow the type before use, aligning with Slonik's philosophy of enforcing runtime type validation.
