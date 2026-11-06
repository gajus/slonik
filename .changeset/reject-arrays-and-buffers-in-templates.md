---
"@slonik/sql-tag": minor
"slonik": minor
---

fix: the types no longer accept arrays and buffers as values interpolated in a query, or as members of `sql.join`, `sql.list`, `sql.and` and `sql.or`. They passed type-checking, but always threw at runtime (e.g. "Unexpected value expression."). Bind arrays using `sql.array` and buffers using `sql.binary`. Code that interpolates a value typed as `PrimitiveValueExpression` (which includes arrays and buffers) no longer compiles; type the value as `ValueExpression` instead.
