## Query building

Queries are built using methods of the `sql` tagged template literal.

If this is your first time using Slonik, read [Dynamically generating SQL queries using Node.js](https://dev.to/gajus/dynamically-generating-sql-queries-using-node-js-2c1g).

### `sql.array`

```ts
(
  values: readonly PrimitiveValueExpression[],
  memberType: SqlFragment | TypeNameIdentifier,
) => ArraySqlToken,
```

Creates an array value binding, e.g.

```ts
await connection.query(sql.typeAlias('id')`
  SELECT (${sql.array([1, 2, 3], 'int4')}) AS id
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

If `memberType` is a string (`TypeNameIdentifier`), then it is treated as a type name identifier and will be quoted using double quotes, i.e. `sql.array([1, 2, 3], 'int4')` is equivalent to `$1::"int4"[]`. The implication is that keywords that are often used interchangeably with type names are not going to work, e.g. [`int4`](https://github.com/postgres/postgres/blob/69edf4f8802247209e77f69e089799b3d83c13a4/src/include/catalog/pg_type.dat#L74-L78) is a type name identifier and will work. However, [`int`](https://github.com/postgres/postgres/blob/69edf4f8802247209e77f69e089799b3d83c13a4/src/include/parser/kwlist.h#L213) is a keyword and will not work. You can either use type name identifiers or you can construct custom member using `sql.fragment` tag, e.g.

```ts
await connection.query(sql.typeAlias('id')`
  SELECT (${sql.array([1, 2, 3], sql.fragment`int[]`)}) AS id
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
sql.typeAlias('id')`
  SELECT id
  FROM foo
  WHERE id IN (${sql.join([1, 2, 3], sql.fragment`, `)})
`;
sql.typeAlias('id')`
  SELECT id
  FROM foo
  WHERE id NOT IN (${sql.join([1, 2, 3], sql.fragment`, `)})
`;
```

Is equivalent to:

```ts
sql.typeAlias('id')`
  SELECT id
  FROM foo
  WHERE id = ANY(${sql.array([1, 2, 3], 'int4')})
`;
sql.typeAlias('id')`
  SELECT id
  FROM foo
  WHERE id != ALL(${sql.array([1, 2, 3], 'int4')})
`;
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
await connection.query(sql.unsafe`
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

### `sql.date`

```ts
(
  date: Date
) => DateSqlToken;
```

Inserts a date, e.g.

```ts
await connection.query(sql.unsafe`
  SELECT ${sql.date(new Date('2022-08-19T03:27:24.951Z'))}
`);
```

Produces:

```ts
{
  sql: 'SELECT $1::date',
  values: [
    '2022-08-19'
  ]
}
```

### `sql.fragment`

```ts
(
  template: TemplateStringsArray,
  ...values: ValueExpression[]
) => SqlFragment;
```

A SQL fragment, e.g.

```ts
sql.fragment`FOO`
```

Produces:

```ts
{
  sql: 'FOO',
  values: []
}
```

SQL fragments can be used to build more complex queries, e.g.

```ts
const whereFragment = sql.fragment`
  WHERE bar = 'baz';
`;

sql.typeAlias('id')`
  SELECT id
  FROM foo
  ${whereFragment}
`
```

The only difference between queries and fragments is that fragments are untyped and they cannot be used as inputs to query methods (use `sql.type` instead).

### `sql.identifier`

```ts
(
  names: string[],
) => IdentifierSqlToken;
```

[Delimited identifiers](https://www.postgresql.org/docs/current/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS) are created by enclosing an arbitrary sequence of characters in double-quotes ("). To create a delimited identifier, create an `sql` tag function placeholder value using `sql.identifier`, e.g.

```ts
sql.typeAlias('id')`
  SELECT 1 AS id
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

### `sql.interval`

```ts
(
  interval: {
    years?: number,
    months?: number,
    weeks?: number,
    days?: number,
    hours?: number,
    minutes?: number,
    seconds?: number,
  }
) => IntervalSqlToken;
```

Inserts an [interval](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-INTERVAL-INPUT), e.g.

```ts
sql.typeAlias('id')`
  SELECT 1 AS id
  FROM ${sql.interval({days: 3})}
`;
```

Produces:

```ts
{
  sql: 'SELECT make_interval("days" => $1)',
  values: [
    3
  ]
}
```

You can use `sql.interval` exactly how you would use PostgreSQL [`make_interval` function](https://www.postgresql.org/docs/current/functions-datetime.html). However, notice that Slonik does not use abbreviations, i.e. "secs" is seconds and "mins" is minutes.

|`make_interval`|`sql.interval`|Interval output|
|---|---|---|
|`make_interval("days" => 1, "hours" => 2)`|`sql.interval({days: 1, hours: 2})`|`1 day 02:00:00`|
|`make_interval("mins" => 1)`|`sql.interval({minutes: 1})`|`00:01:00`|
|`make_interval("secs" => 120)`|`sql.interval({seconds: 120})`|`00:02:00`|
|`make_interval("secs" => 0.001)`|`sql.interval({seconds: 0.001})`|`00:00:00.001`|

#### Dynamic intervals without `sql.interval`

If you need a dynamic interval (e.g. X days), you can achieve this using multiplication, e.g.

```ts
sql.unsafe`
  SELECT ${2} * interval '1 day'
`
```

The above is equivalent to `interval '2 days'`.

You could also use `make_interval()` directly, e.g.

```ts
sql.unsafe`
  SELECT make_interval("days" => ${2})
`
```

`sql.interval` was added mostly as a type-safe alternative.

### `sql.join`

```ts
(
  members: SqlSqlToken[],
  glue: SqlSqlToken
) => ListSqlToken;
```

Concatenates SQL expressions using `glue` separator, e.g.

```ts
await connection.query(sql.unsafe`
  SELECT ${sql.join([1, 2, 3], sql.fragment`, `)}
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
sql.unsafe`
  SELECT ${sql.join([1, 2], sql.fragment` AND `)}
`

// SELECT $1 AND $2
```

Tuple:

```ts
sql.unsafe`
  SELECT (${sql.join([1, 2], sql.fragment`, `)})
`

// SELECT ($1, $2)
```

Tuple list:

```ts
sql.unsafe`
  SELECT ${sql.join(
    [
      sql.fragment`(${sql.join([1, 2], sql.fragment`, `)})`,
      sql.fragment`(${sql.join([3, 4], sql.fragment`, `)})`,
    ],
    sql.fragment`, `
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
await connection.query(sql.unsafe`
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
await connection.query(sql.unsafe`
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
await connection.query(sql.unsafe`
  CREATE USER "foo" WITH PASSWORD ${sql.literalValue('bar')}
`);
```

Produces:

```ts
{
  sql: 'CREATE USER "foo" WITH PASSWORD \'bar\''
}
```

### `sql.timestamp`

```ts
(
  date: Date
) => TimestampSqlToken;
```

Inserts a timestamp, e.g.

```ts
await connection.query(sql.unsafe`
  SELECT ${sql.timestamp(new Date('2022-08-19T03:27:24.951Z'))}
`);
```

Produces:

```ts
{
  sql: 'SELECT to_timestamp($1)',
  values: [
    '1660879644.951'
  ]
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
await connection.query(sql.unsafe`
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
await connection.query(sql.unsafe`
  SELECT bar, baz
  FROM ${sql.unnest(
    [
      [1, 'foo'],
      [2, 'bar']
    ],
    [
      sql.fragment`integer`,
      sql.fragment`text`
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
await connection.query(sql.unsafe`
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

### `sql.unsafe`

```ts
(
  template: TemplateStringsArray,
  ...values: ValueExpression[]
) => QuerySqlToken;
```

Creates a query with Zod `any` type. The result of such a query has TypeScript type `any`.

```ts
const result = await connection.one(sql.unsafe`
  SELECT foo
  FROM bar
`);

// `result` type is `any`
```

`sql.unsafe` is effectively a shortcut to `sql.type(z.any())`.

`sql.unsafe` is as a convenience method for development. Your production code must not use `sql.unsafe`. Instead,

* Use `sql.type` to type the query result
* Use `sql.typeAlias` to alias an existing type
* Use `sql.fragment` if you are writing a fragment of a query