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

You can create a `sql` tag with a predefined set of Zod type aliases that can be later referenced when creating a query with [runtime validation](#runtime-validation).

Slonik documentation assumes that these type aliases are defined:

```ts
const sql = createSqlTag({
  typeAliases: {
    // `foo` is a documentation specific example
    foo: z.object({
      foo: z.string(),
    }),
    id: z.object({
      id: z.number(),
    }),
    void: z.object({}).strict(),
  }
})
```

These are documentation specific examples that you are not expected to blindly copy. However, `id` and `void` are recommended aliases as they reflect common patterns, e.g.

```ts
const personId = await pool.oneFirst(
  sql.typeAlias('id')`
    SELECT id
    FROM person
  `
);

await pool.query(sql.typeAlias('void')`
  INSERT INTO person_view (person_id)
  VALUES (${personId})
`);
```

### Typing `sql` tag

See [runtime validation](#runtime-validation).