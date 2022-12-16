## Value placeholders

### Tagged template literals

Slonik query methods can only be executed using `sql` [tagged template literal](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals), e.g.

```ts
import {
  sql
} from 'slonik'

connection.query(sql.typeAlias('id')`
  SELECT 1 AS id
  FROM foo
  WHERE bar = ${'baz'}
`);
```

The above is equivalent to evaluating:

```sql
SELECT 1 AS id
FROM foo
WHERE bar = $1

```

query with 'baz' value binding.

### Manually constructing the query

Manually constructing queries is not allowed.

There is an internal mechanism that checks to see if query was created using `sql` tagged template literal, i.e.

```ts
const query = {
  sql: 'SELECT 1 AS id FROM foo WHERE bar = $1',
  type: 'SQL',
  values: [
    'baz'
  ]
};

connection.query(query);
```

Will result in an error:

> Query must be constructed using `sql` tagged template literal.

This is a security measure designed to prevent unsafe query execution.

Furthermore, a query object constructed using `sql` tagged template literal is [frozen](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) to prevent further manipulation.

### Nesting `sql`

`sql` tagged template literals can be nested, e.g.

```ts
const query0 = sql.unsafe`SELECT ${'foo'} FROM bar`;
const query1 = sql.unsafe`SELECT ${'baz'} FROM (${query0})`;
```

Produces:

```ts
{
  sql: 'SELECT $1 FROM (SELECT $2 FROM bar)',
  values: [
    'baz',
    'foo'
  ]
}
```
