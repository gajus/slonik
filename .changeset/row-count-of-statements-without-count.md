---
"slonik": patch
---

fix: `rowCount` is the number of returned rows for statements that do not report a row count (e.g. `SHOW` and `EXPLAIN`), instead of 0. This also stops `slonik-interceptor-query-cache` from treating the results of such statements as empty (`discardEmpty`).
