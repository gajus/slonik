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

The above is equivalent to evaluating:

```sql
SELECT 1
FROM foo
WHERE bar = $1

```

query with 'baz' value binding.

### `sql.valueList`

```js
(values: $ReadOnlyArray<PrimitiveValueExpressionType>) => ValueListSqlTokenType;

```

Creates a list of values, e.g.

```js
await connection.query(sql`
  SELECT (${sql.valueList([1, 2, 3])})
`);

```

Produces:

```js
{
  sql: 'SELECT ($1, $2, $3)',
  values: [
    1,
    2,
    3
  ]
}

```

### `sql.tuple`

```js
(values: $ReadOnlyArray<PrimitiveValueExpressionType>) => TupleSqlTokenType;

```

Creates a tuple (typed row construct), e.g.

```js
await connection.query(sql`
  INSERT INTO (foo, bar, baz)
  VALUES ${sql.tuple([1, 2, 3])}
`);

```

Produces:

```js
{
  sql: 'INSERT INTO (foo, bar, baz) VALUES ($1, $2, $3)',
  values: [
    1,
    2,
    3
  ]
}

```

### `sql.tupleList`

```js
(tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>) => TupleListSqlTokenType;

```

Creates a list of tuples (typed row constructs), e.g.

```js
await connection.query(sql`
  INSERT INTO (foo, bar, baz)
  VALUES ${sql.tupleList([
    [1, 2, 3],
    [4, 5, 6]
  ])}
`);

```

Produces:

```js
{
  sql: 'INSERT INTO (foo, bar, baz) VALUES ($1, $2, $3), ($4, $5, $6)',
  values: [
    1,
    2,
    3,
    4,
    5,
    6
  ]
}

```

### `sql.identifier`

```js
(names: $ReadOnlyArray<string>) => IdentifierTokenType;

```

[Delimited identifiers](https://www.postgresql.org/docs/current/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS) are created by enclosing an arbitrary sequence of characters in double-quotes ("). To create create a delimited identifier, create an `sql` tag function placeholder value using `sql.identifier`, e.g.

```js
sql`
  SELECT 1
  FROM ${sql.identifier(['bar', 'baz'])}
`;

```

Produces:

```js
{
  sql: 'SELECT 1 FROM "bar"."bar"',
  values: []
}

```

### `sql.raw`

```js
(rawSql: string, values?: $ReadOnlyArray<PrimitiveValueExpressionType>) => RawSqlTokenType;

```

Raw/ dynamic SQL can be inlined using `sql.raw`, e.g.

```js
sql`
  SELECT 1
  FROM ${sql.raw('"bar"')}
`;

```

Produces:

```js
{
  sql: 'SELECT 1 FROM "bar"',
  values: []
}

```

The second parameter of the `sql.raw` can be used to bind values, e.g.

```js
sql`
  SELECT ${sql.raw('$1', [1])}
`;

```

Produces:

```js
{
  sql: 'SELECT $1',
  values: [
    1
  ]
}

```
