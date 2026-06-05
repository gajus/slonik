---
"slonik": minor
---

Add `record()` query method

`record()` returns the result rows as a `key` → `value` record. The query must return exactly two columns, named `"key"` and `"value"`, which is enforced at the type level by requiring a typed query (`sql.type`). Throws `DataIntegrityError` if the query returns rows with any other columns, or if the query returns duplicate keys.

```ts
const memberCounts = await pool.record(sql.type(
  z.object({
    key: z.number(),
    value: z.number(),
  }),
)`
  SELECT
    team_id AS "key",
    count(*)::int AS "value"
  FROM team_member
  GROUP BY team_id
`);

// Record<number, number>, e.g. { 1: 2, 2: 5 }
```
