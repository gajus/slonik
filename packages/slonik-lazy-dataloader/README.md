# Lazy DataLoader

Connection pool wrapper with seamless query batching.

## Usage

```ts
import { createLazyDataLoader } from '@slonik/lazy-dataloader';
import {
  createPool,
  sql,
} from 'slonik';
import { z } from 'zod';

const pool = createPool('postgres://');

const lazyDataLoader = createLazyDataLoader(pool);

const results = await Promise.all([
  lazyDataLoader.oneFirst(
    sql.type(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    )`
      SELECT id, name
      FROM person
      WHERE id = ${1}
    `
  ),
  lazyDataLoader.oneFirst(
    sql.type(
      z.object({
        id: z.number(),
        name: z.string(),
        website: z.string().nullable(),
      })
    )`
      SELECT id, name, website
      FROM company
      WHERE id = ${2}
    `
  ),
]);

console.log(results);
```

In this example:

* Both queries will be batched into a single query.
* `results` will be an array with the results of the two queries.

## How it works

Using the same idea as [DataLoader](https://github.com/graphql/dataloader), `LazyDataLoader` will batch all queries that are executed in the same tick. This is done by using sub-queries for every query. Example:

```sql
SELECT
  (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT id, name
      FROM person
      WHERE id = 1
    ) t
  ) query_1,
  (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT id, name, website
      FROM company
      WHERE id = 2
    ) t
  ) query_2
```

## Use cases

This is experimental approach to help with the N+1 problem that is common in GraphQL APIs.

The same problem can be solved more efficiently by using a [DataLoader](https://github.com/graphql/dataloader) directly and hand crafting the queries. This approach is more flexible and efficient, but requires more work. This library is a middle ground that can be used in some cases to reduce the impact of the N+1 problem by reducing the number of round trips to the database.