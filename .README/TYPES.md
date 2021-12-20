## Types

This package is using [TypeScript](http://typescriptlang.org/) types.

Refer to [`./src/types.js`](./src/types.js).

The public interface exports the following types:

* `DatabaseConnection`
* `DatabasePoolConnection`
* `DatabaseSingleConnection`

Use these types to annotate `connection` instance in your code base, e.g.

```js
import type {
  DatabaseConnection
} from 'slonik';

export default async (
  connection: DatabaseConnection,
  code: string
): Promise<number> => {
  const countryId = await connection.oneFirst(sql`
    SELECT id
    FROM country
    WHERE code = ${code}
  `);

  return countryId;
};

```

The `sql` tag itself can receive a generic type, allowing strong type-checking for query results:

```ts
interface Country {
  id: number
  code: string
}

const countryQuery = sql<Country>`SELECT id, code FROM country`;

const country = await connection.one(countryQuery);

console.log(country.cod) // ts error: Property 'cod' does not exist on type 'Country'. Did you mean 'code'?
```

It is recommended to give a generic type to the `sql` tag itself, rather than the query method, since each query method uses generic types slightly differently:

```ts
// bad
await pool.query<{ foo: string }>(sql`SELECT foo FROM bar`)

// good
await pool.query(sql<{ foo: string }>`SELECT foo FROM bar`)
```

[@slonik/typegen](https://npmjs.com/package/@slonik/typegen) is a community library which will scan your source code for `sql` queries, and apply typescript interfaces to them automatically.