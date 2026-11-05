---
"slonik": minor
---

fix: `oneFirst` throws `DataIntegrityError` (instead of `UnexpectedStateError`) when the query returns multiple columns, like `maybeOneFirst`, `anyFirst` and `manyFirst`.
