## Query building

Queries are built using methods of the `sql` tagged template literal.

If this is your first time using Slonik, read [Dynamically generating SQL queries using Node.js](https://dev.to/gajus/dynamically-generating-sql-queries-using-node-js-2c1g).

### `sql.array`

```ts
(
  values: PrimitiveValueExpression[],
  memberType: TypeNameIdentifier | SqlToken
) => ArraySqlToken;
```

Creates an array value binding, e.g.

```ts
await connection.query(sql`
  SELECT (${sql.array([1, 2, 3], 'int4')})
`);
```

Produces:

```ts
{
  sql: 'SELECT $1::"int4"[]',
  values: [
    [
      1,
      2,
      3
    ]
  ]
}
```

#### `sql.array` `memberType`

If `memberType` is a string (`TypeNameIdentifier`), then it is treated as a type name identifier and will be quoted using double quotes, i.e. `sql.array([1, 2, 3], 'int4')` is equivalent to `$1::"int4"[]`. The implication is that keywords that are often used interchangeably with type names are not going to work, e.g. [`int4`](https://github.com/postgres/postgres/blob/69edf4f8802247209e77f69e089799b3d83c13a4/src/include/catalog/pg_type.dat#L74-L78) is a type name identifier and will work. However, [`int`](https://github.com/postgres/postgres/blob/69edf4f8802247209e77f69e089799b3d83c13a4/src/include/parser/kwlist.h#L213) is a keyword and will not work. You can either use type name identifiers or you can construct custom member using `sql` tag, e.g.

```ts
await connection.query(sql`
  SELECT (${sql.array([1, 2, 3], sql`int[]`)})
`);
```

Produces:

```ts
{
  sql: 'SELECT $1::int[]',
  values: [
    [
      1,
      2,
      3
    ]
  ]
}
```

#### `sql.array` vs `sql.join`

Unlike `sql.join`, `sql.array` generates a stable query of a predictable length, i.e. regardless of the number of values in the array, the generated query remains the same:

* Having a stable query enables [`pg_stat_statements`](https://www.postgresql.org/docs/current/pgstatstatements.html) to aggregate all query execution statistics.
* Keeping the query length short reduces query parsing time.

Example:

```ts
sql`SELECT id FROM foo WHERE id IN (${sql.join([1, 2, 3], sql`, `)})`;
sql`SELECT id FROM foo WHERE id NOT IN (${sql.join([1, 2, 3], sql`, `)})`;
```

Is equivalent to:

```ts
sql`SELECT id FROM foo WHERE id = ANY(${sql.array([1, 2, 3], 'int4')})`;
sql`SELECT id FROM foo WHERE id != ALL(${sql.array([1, 2, 3], 'int4')})`;
```

Furthermore, unlike `sql.join`, `sql.array` can be used with an empty array of values. In short, `sql.array` should be preferred over `sql.join` when possible.

### `sql.binary`

```ts
(
  data: Buffer
) => BinarySqlToken;
```

Binds binary ([`bytea`](https://www.postgresql.org/docs/current/datatype-binary.html)) data, e.g.

```ts
await connection.query(sql`
  SELECT ${sql.binary(Buffer.from('foo'))}
`);
```

Produces:

```ts
{
  sql: 'SELECT $1',
  values: [
    Buffer.from('foo')
  ]
}
```

### `sql.identifier`

```ts
(
  names: string[],
) => IdentifierSqlToken;
```

[Delimited identifiers](https://www.postgresql.org/docs/current/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS) are created by enclosing an arbitrary sequence of characters in double-quotes ("). To create a delimited identifier, create an `sql` tag function placeholder value using `sql.identifier`, e.g.

```ts
sql`
  SELECT 1
  FROM ${sql.identifier(['bar', 'baz'])}
`;
```

Produces:

```ts
{
  sql: 'SELECT 1 FROM "bar"."baz"',
  values: []
}
```

### `sql.join`

```ts
(
  members: SqlSqlToken[],
  glue: SqlSqlToken
) => ListSqlToken;
```

Concatenates SQL expressions using `glue` separator, e.g.

```ts
await connection.query(sql`
  SELECT ${sql.join([1, 2, 3], sql`, `)}
`);
```

Produces:

```ts
{
  sql: 'SELECT $1, $2, $3',
  values: [
    1,
    2,
    3
  ]
}
```

`sql.join` is the primary building block for most of the SQL, e.g.

Boolean expressions:

```ts
sql`
  SELECT ${sql.join([1, 2], sql` AND `)}
`

// SELECT $1 AND $2
```

Tuple:

```ts
sql`
  SELECT (${sql.join([1, 2], sql`, `)})
`

// SELECT ($1, $2)
```

Tuple list:

```ts
sql`
  SELECT ${sql.join(
    [
      sql`(${sql.join([1, 2], sql`, `)})`,
      sql`(${sql.join([3, 4], sql`, `)})`,
    ],
    sql`, `
  )}
`

// SELECT ($1, $2), ($3, $4)
```

### `sql.json`

```ts
(
  value: SerializableValue
) => JsonSqlToken;
```

Serializes value and binds it as a JSON string literal, e.g.

```ts
await connection.query(sql`
  SELECT (${sql.json([1, 2, 3])})
`);
```

Produces:

```ts
{
  sql: 'SELECT $1::json',
  values: [
    '[1,2,3]'
  ]
}
```

### `sql.jsonb`

```ts
(
  value: SerializableValue
) => JsonBinarySqlToken;
```

Serializes value and binds it as a JSON binary, e.g.

```ts
await connection.query(sql`
  SELECT (${sql.jsonb([1, 2, 3])})
`);
```

Produces:

```ts
{
  sql: 'SELECT $1::jsonb',
  values: [
    '[1,2,3]'
  ]
}
```

### `sql.literalValue`

> ⚠️ Do not use. This method interpolates values as literals and it must be used only for [building utility statements](#slonik-recipes-building-utility-statements). You are most likely looking for [value placeholders](#slonik-value-placeholders).

```ts
(
  value: string,
) => SqlSqlToken;
```

Escapes and interpolates a literal value into a query.

```ts
await connection.query(sql`
  CREATE USER "foo" WITH PASSWORD ${sql.literalValue('bar')}
`);
```

Produces:

```ts
{
  sql: 'CREATE USER "foo" WITH PASSWORD \'bar\''
}
```

### `sql.unnest`

```ts
(
  tuples: ReadonlyArray<readonly any[]>,
  columnTypes:  Array<[...string[], TypeNameIdentifier]> | Array<SqlSqlToken | TypeNameIdentifier>
): UnnestSqlToken;
```

Creates an `unnest` expressions, e.g.

```ts
await connection.query(sql`
  SELECT bar, baz
  FROM ${sql.unnest(
    [
      [1, 'foo'],
      [2, 'bar']
    ],
    [
      'int4',
      'text'
    ]
  )} AS foo(bar, baz)
`);
```

Produces:

```ts
{
  sql: 'SELECT bar, baz FROM unnest($1::"int4"[], $2::"text"[]) AS foo(bar, baz)',
  values: [
    [
      1,
      2
    ],
    [
      'foo',
      'bar'
    ]
  ]
}
```

If `columnType` array member type is `string`, it will treat it as a type name identifier (and quote with double quotes; illustrated in the example above).

If `columnType` array member type is `SqlToken`, it will inline type name without quotes, e.g.

```ts
await connection.query(sql`
  SELECT bar, baz
  FROM ${sql.unnest(
    [
      [1, 'foo'],
      [2, 'bar']
    ],
    [
      sql`integer`,
      sql`text`
    ]
  )} AS foo(bar, baz)
`);
```

Produces:

```ts
{
  sql: 'SELECT bar, baz FROM unnest($1::integer[], $2::text[]) AS foo(bar, baz)',
  values: [
    [
      1,
      2
    ],
    [
      'foo',
      'bar'
    ]
  ]
}
```

If `columnType` array member type is `[...string[], TypeNameIdentifier]`, it will act as [`sql.identifier`](#sqlidentifier), e.g.

```ts
await connection.query(sql`
  SELECT bar, baz
  FROM ${sql.unnest(
    [
      [1, 3],
      [2, 4]
    ],
    [
      ['foo', 'int4'],
      ['foo', 'int4']
    ]
  )} AS foo(bar, baz)
`);
```

Produces:

```ts
{
  sql: 'SELECT bar, baz FROM unnest($1::"foo"."int4"[], $2::"foo"."int4"[]) AS foo(bar, baz)',
  values: [
    [
      1,
      2
    ],
    [
      3,
      4
    ]
  ]
}
```
