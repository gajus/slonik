## Value placeholders

### Tagged template literals

Slonik query methods can only be executed using `sql` [tagged template literal](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals), e.g.

```js
import {
  sql
} from 'slonik'

connection.query(sql`
  SELECT 1
  FROM foo
  WHERE bar = ${'baz'}
`);

```

Produces:

```sql
SELECT 1
FROM foo
WHERE bar = $1

```

and is evaluated with 'baz' value binding.

### `sql.set`

`sql.set` is used to create a typed row construct (or a set, depending on the context), e.g.

```js
await connection.query(sql`
  SELECT ${sql.set([1, 2, 3])}
`);

```

Produces:

```sql
SELECT ($1, $2, $3)

```

### `sql.multiset`

`sql.multiset` is used to create a comma-separated list of typed row constructs, e.g.

```js
await connection.query(sql`
  SELECT ${sql.multiset([
    [1, 2, 3],
    [1, 2, 3]
  ])}
`);

```

Produces:

```sql
SELECT ($1, $2, $3), ($4, $5, $6)

```

### `sql.identifier`

[Delimited identifiers](https://www.postgresql.org/docs/current/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS) are created by enclosing an arbitrary sequence of characters in double-quotes ("). To create create a delimited identifier, create an `sql` tag function placeholder value using `sql.identifier`, e.g.

```js
sql`
  SELECT 1
  FROM ${sql.identifier(['bar', 'baz'])}
`;

```

Produces:

```sql
SELECT 1
FROM "bar"."bar"

```

### `sql.raw`

Raw/ dynamic SQL can be inlined using `sql.raw`, e.g.

```js
sql`
  SELECT 1
  FROM ${sql.raw('"bar"')}
`;

```

Produces:

```sql
SELECT 1
FROM "bar"

```
