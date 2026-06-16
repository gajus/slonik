---
"slonik": patch
---

Avoid redundant per-query field array allocation

The query execution routine rebuilt the result's `fields` array on every query,
copying each `{ dataTypeId, name }` descriptor into a freshly allocated array of
objects. The driver already returns fields in exactly this shape (`DriverField`
is structurally identical to `Field`), so the copy was pure per-query overhead —
one array plus one object per column on every query.

The driver's array is now forwarded directly. Behaviour is unchanged; this only
removes fixed-per-query allocation, which is most noticeable on high-throughput,
small-result workloads (e.g. `maybeOne` and other single-row queries).
