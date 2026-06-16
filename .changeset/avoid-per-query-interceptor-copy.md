---
"slonik": patch
---

Avoid copying the interceptor array on every query

`executeQueryInternal` copied `clientConfiguration.interceptors` with `.slice()`
on every query before running the result hooks. The array is `readonly` and is
never mutated during a query — the before-query and error hooks already iterate
it directly — so the copy was a wasted array allocation per query.

The interceptors are now read directly. Behaviour is unchanged; this removes
fixed-per-query allocation, most noticeable on high-throughput workloads.
