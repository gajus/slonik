## Types

This package is using [TypeScript](http://typescriptlang.org/) types.

Refer to [`./src/types.ts`](./src/types.ts).

The public interface exports the following types:

* `CommonQueryMethods` (most generic)
* `DatabaseConnection` (`DatabasePool | DatabasePoolConnection`)
* `DatabasePool`
* `DatabasePoolConnection`
* `DatabaseTransactionConnection`

Use these types to annotate `connection` instance in your code base, e.g.

```ts
import {
  type DatabaseConnection
} from 'slonik';

export default async (
  connection: DatabaseConnection,
  code: string
): Promise<number> => {
  return await connection.oneFirst(sql`
    SELECT id
    FROM country
    WHERE code = ${code}
  `);
};
```

The `sql` tag itself can receive a generic type, allowing strong type-checking for query results:

```ts
type Country = {
  id: number
  code: string
}

const countryQuery = sql<Country>`SELECT id, code FROM country`;

const country = await connection.one(countryQuery);

// ts error: Property 'cod' does not exist on type 'Country'. Did you mean 'code'?
console.log(country.cod);
```

It is recommended to give a generic type to the `sql` tag itself, rather than the query method, since each query method uses generic types slightly differently:

```ts
// bad
await pool.query<{ foo: string }>(sql`SELECT foo FROM bar`)

// good
await pool.query(sql<{ foo: string }>`SELECT foo FROM bar`)
```