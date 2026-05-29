---
"@slonik/errors": minor
---

Expose the violated `columns` (and raw `detail`) on `IntegrityConstraintViolationError`

`IntegrityConstraintViolationError` and its subclasses (`UniqueIntegrityConstraintViolationError`, `ForeignKeyIntegrityConstraintViolationError`, `NotNullIntegrityConstraintViolationError`, `CheckIntegrityConstraintViolationError`) now expose two additional fields:

- `columns: readonly string[]` — the column(s) involved in the violation. Postgres only populates the wire-protocol `column` field for not-NULL violations; for unique and foreign key violations the column(s) are parsed from the error `detail` (e.g. `Key (email)=(...) already exists.`). This lets application code branch on the offending column(s) instead of coupling to a raw constraint/index name. Expression and partial index columns are intentionally not extracted (the array is left empty rather than reporting a misleading name).
- `detail: null | string` — the raw Postgres error detail string, exposed directly on the error.

The existing singular `column` field is unchanged.
