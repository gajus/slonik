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
  return await connection.oneFirst(sql.typeAlias('id')`
    SELECT id
    FROM country
    WHERE code = ${code}
  `);
};
```

See [runtime validation](#runtime-validation).