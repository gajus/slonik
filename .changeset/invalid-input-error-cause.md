---
"@slonik/pg-driver": minor
---

fix: `InvalidInputError` raised for SQLSTATE 22P02 (invalid text representation) includes the original error as `cause`, like the other errors that the driver maps.
