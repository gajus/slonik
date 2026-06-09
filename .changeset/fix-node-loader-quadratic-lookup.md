---
"@slonik/dataloaders": patch
---

Fix O(n²) record matching in `createNodeByIdLoaderClass`

The node-by-id DataLoader batches all keys into a single query, but then
matched the returned rows back to the requested keys using
`Array.prototype.find` inside a `map`, making the in-memory join O(n²) in the
batch size. For large batches this added significant synchronous, event-loop
blocking CPU time after the query had already returned (e.g. ~800ms for a
10,000-key batch).

The rows are now indexed into a `Map` once and looked up in O(1) per key —
mirroring the grouping approach already used in `batchQueries`. Behaviour is
unchanged, including first-match-wins semantics for duplicate key values.
