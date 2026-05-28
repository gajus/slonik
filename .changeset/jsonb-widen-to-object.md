---
"@slonik/sql-tag": minor
"@slonik/types": minor
---

feat: widen `SerializableValue` to `object` and drop `undefined`

`SerializableValue` is now `boolean | null | number | object | string`.

- The previous `{ [key: string]: unknown }` and `unknown[]` branches required
  TypeScript to see an explicit string index signature, so values typed as
  `object` or as interfaces with named properties (e.g.
  `{ name: string; payload: Record<string, unknown> }`) still failed to
  type-check. Using `object` accepts both.
- `undefined` is removed from the union. It was always rejected at runtime
  with `JSON payload must not be undefined.`; the type now matches.
