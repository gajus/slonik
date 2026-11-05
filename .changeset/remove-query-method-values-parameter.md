---
"slonik": minor
---

remove the `values` parameter from the types of the query methods (e.g. `pool.query(query, values)`). The parameter was accepted, but ignored; values are bound using the `sql` tag.
