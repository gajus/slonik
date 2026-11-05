---
"slonik": minor
---

fix: a query that fails with `NotFoundError`, `DataIntegrityError` or `SchemaValidationError` (e.g. `pool.one()` that finds no rows) no longer destroys its connection; the connection is returned to the pool. This applies to queries and transactions on the pool. Connections used by `pool.connect()` are still destroyed when the routine fails.
