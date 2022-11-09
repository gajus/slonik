## `sql` tag

`sql` tag serves two purposes:

* It is used to construct queries with bound parameter values (see [Value placeholders](#value-placeholders)).
* It used to generate dynamic query fragments (see [Query building](#query-building)).

`sql` tag can be imported from Slonik package:

```ts
import {
  sql
} from 'slonik';
```

Sometimes it may be desirable to construct a custom instance of `sql` tag. In those cases, you can use the `createSqlTag` factory, e.g.

```ts
import {
  createSqlTag
} from 'slonik';

const sql = createSqlTag();
```

### Type aliases

You can create a `sql` tag with a predefined set of Zod type aliases that can be later referenced when creating a query with [runtime validation](#runtime-validation), e.g.

```ts
const sql = createSqlTag({
  typeAliases: {
    id: z.object({
      id: z.number(),
    }),
  }
})

const personId = await pool.oneFirst(
  sql.typeAlias('id')`
  SELECT id
  FROM person
`);
```

### Typing `sql` tag

See [runtime validation](#runtime-validation).