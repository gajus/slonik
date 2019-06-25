## Query building

### `sql.valueList`

Note: Before using `sql.valueList` evaluate if [`sql.array`](#sqlarray) is not a better option.

```js
(
  values: $ReadOnlyArray<PrimitiveValueExpressionType>
) => ValueListSqlTokenType;

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

Value list can describe other SQL tokens, e.g.

```js
await connection.query(sql`
  SELECT (${sql.valueList([1, sql.raw('to_timestamp($1)', [2]), 3])})
`);

```

Produces:

```js
{
  sql: 'SELECT ($1, to_timestamp($2), $3)',
  values: [
    1,
    2,
    3
  ]
}

```

### `sql.array`

```js
(
  values: $ReadOnlyArray<PrimitiveValueExpressionType>
) => ValueListSqlTokenType;

```

Creates an array value binding, e.g.

```js
await connection.query(sql`
  SELECT (${sql.array([1, 2, 3], 'int4')})
`);

```

Produces:

```js
{
  sql: 'SELECT $1::int4[]',
  values: [
    [
      1,
      2,
      3
    ]
  ]
}

```


Unlike `sql.valueList`, `sql.array` generates a stable query of a predictable length, i.e. regardless of the number of the values in the array, the generated query remains the same:

* Having a stable query enables [`pg_stat_statements`](https://www.postgresql.org/docs/current/pgstatstatements.html) to aggregate all query execution statistics.
* Keeping the query length short reduces query parsing time.

Furthermore, unlike `sql.valueList`, `sql.array` can be used with an empty array of values.

Example:

```js
sql`SELECT id FROM foo WHERE id IN (${sql.valueList([1, 2, 3])})`;
sql`SELECT id FROM foo WHERE id NOT IN (${sql.valueList([1, 2, 3])})`;

```

Is equivalent to:

```js
sql`SELECT id FROM foo WHERE id = ANY(${sql.array([1, 2, 3], 'int4')})`;
sql`SELECT id FROM foo WHERE id != ALL(${sql.array([1, 2, 3], 'int4')})`;

```

In short, when the value list length is dynamic then `sql.array` should be preferred over `sql.valueList`.

### `sql.tuple`

```js
(
  values: $ReadOnlyArray<PrimitiveValueExpressionType>
) => TupleSqlTokenType;

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

Tuple can describe other SQL tokens, e.g.

```js
await connection.query(sql`
  INSERT INTO (foo, bar, baz)
  VALUES ${sql.tuple([1, sql.raw('to_timestamp($1)', [2]), 3])}
`);

```

Produces:

```js
{
  sql: 'INSERT INTO (foo, bar, baz) VALUES ($1, to_timestamp($2), $3)',
  values: [
    1,
    2,
    3
  ]
}

```

### `sql.tupleList`

```js
(
  tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>
) => TupleListSqlTokenType;

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

Tuple list can describe other SQL tokens, e.g.

```js
await connection.query(sql`
  INSERT INTO (foo, bar, baz)
  VALUES ${sql.tupleList([
    [1, sql.raw('to_timestamp($1)', [2]), 3],
    [4, sql.raw('to_timestamp($1)', [5]), 6]
  ])}
`);

```

Produces:

```js
{
  sql: 'INSERT INTO (foo, bar, baz) VALUES ($1, to_timestamp($2), $3), ($4, to_timestamp($5), $6)',
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

### `sql.unnest`

```js
(
  tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
  columnTypes: $ReadOnlyArray<string>
): UnnestSqlTokenType;

```

Creates an `unnest` expressions, e.g.

```js
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

```js
{
  sql: 'SELECT bar, baz FROM unnest($1::int4[], $2::text[]) AS foo(bar, baz)',
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

### `sql.identifier`

```js
(
  names: $ReadOnlyArray<string>
) => IdentifierTokenType;

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

### `sql.identifierList`

```js
(
  identifiers: $ReadOnlyArray<$ReadOnlyArray<string>>
) => IdentifierListTokenType;

```

Creates a list of identifiers, e.g.

```js
sql`
  SELECT 1
  FROM ${sql.identifierList([
    ['bar', 'baz'],
    ['qux', 'quux']
  ])}
`;

```

Produces:

```js
{
  sql: 'SELECT 1 FROM "bar"."baz", "qux"."quux"',
  values: []
}

```

#### Identifier aliases

A member of the identifier list can be aliased:

```js
sql`
  SELECT 1
  FROM ${sql.identifierList([
    {
      alias: 'qux',
      identifier: ['bar', 'baz']
    },
    {
      alias: 'corge',
      identifier: ['quux', 'quuz']
    }
  ])}
`;

```

Produces:

```js
{
  sql: 'SELECT 1 FROM "bar"."baz" "qux", "quux"."quuz" "corge"',
  values: []
}

```

### `sql.raw`

```js
(
  rawSql: string,
  values?: $ReadOnlyArray<PrimitiveValueExpressionType>
) => RawSqlTokenType;

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

The second parameter of the `sql.raw` can be used to bind [positional parameter](https://www.postgresql.org/docs/current/sql-expressions.html#SQL-EXPRESSIONS-PARAMETERS-POSITIONAL) values, e.g.

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

#### Building dynamic queries

If you require to build a query based on a _dynamic_ condition, then consider using an SQL builder for that specific query, e.g. [Sqorn](https://sqorn.org/).

```js
const query = sq
  .return({
    authorId: 'a.id',
    name: 'a.last_name'
  })
  .distinct
  .from({
    b: 'book'
    })
  .leftJoin({
    a: 'author'
  })
  .on`b.author_id = a.id`
  .where({
    title: 'Oathbringer',
    genre: 'fantasy'
  })
  .query;

sql`${sql.raw(query.text, query.args)}`

```

#### Named parameters

`sql.raw` supports named parameters, e.g.

```js
sql`
  SELECT ${sql.raw(':foo, :bar', {bar: 'BAR', foo: 'FOO'})}
`;

```

Produces:

```js
{
  sql: 'SELECT $1, $2',
  values: [
    'FOO',
    'BAR'
  ]
}

```

Named parameters are matched using `/[\s,(]:([a-z_]+)/g` regex.

### `sql.booleanExpression`

```js
(
  members: $ReadOnlyArray<ValueExpressionType>,
  operator: LogicalBooleanOperatorType
) => BooleanExpressionTokenType;

```

Boolean expression.

```js
sql`
  SELECT ${sql.booleanExpression([3, 4], 'AND')}
`;

```

Produces:

```js
{
  sql: 'SELECT $1 AND $2',
  values: [
    3,
    4
  ]
}

```

Boolean expressions can describe SQL tokens (including other boolean expressions), e.g.

```js
sql`
  SELECT ${sql.booleanExpression([
    sql.comparisonPredicate(sql.identifier(['foo']), '=', sql.raw('to_timestamp($1)', 2)),
    sql.booleanExpression([
      3,
      4
    ], 'OR')
  ], 'AND')}
`;

```

Produces:

```js
{
  sql: 'SELECT ("foo" = to_timestamp($1) AND ($1 OR $2))',
  values: [
    2,
    3,
    4
  ]
}

```

Note: Do not use `sql.booleanExpression` when expression consists of a single predicate. Use `sql.comparisonPredicate`.

### `sql.comparisonPredicate`

```js
(
  leftOperand: ValueExpressionType,
  operator: ComparisonOperatorType,
  rightOperand: ValueExpressionType
) => ComparisonPredicateTokenType;

```

A comparison predicate compares two expressions using a comparison operator.

```js
sql`
  SELECT ${sql.comparisonPredicate(3, '=', 4)}
`;

```

Produces:

```js
{
  sql: 'SELECT $1 = $2',
  values: [
    3,
    4
  ]
}

```

Comparison predicate operands can describe SQL tokens, e.g.

```js
sql`
  SELECT ${sql.comparisonPredicate(sql.identifier(['foo']), '=', sql.raw('to_timestamp($1)', 2))}
`;

```

Produces:

```js
{
  sql: 'SELECT "foo" = to_timestamp($1)',
  values: [
    2
  ]
}

```

### `sql.assignmentList`

```js
(
  namedAssignmentValueBindings: NamedAssignmentType
) => AssignmentListTokenType

```

Creates an assignment list, e.g.

```js
await connection.query(sql`
  UPDATE foo
  SET ${sql.assignmentList({
    bar: 'baz',
    qux: 'quux'
  })}
`);

```

Produces:

```js
{
  sql: 'UPDATE foo SET bar = $1, qux = $2',
  values: [
    'baz',
    'quux'
  ]
}

```

Assignment list can describe other SQL tokens, e.g.

```js
await connection.query(sql`
  UPDATE foo
  SET ${sql.assignmentList({
    bar: sql.raw('to_timestamp($1)', ['baz']),
    qux: sql.raw('to_timestamp($1)', ['quux'])
  })}
`);

```

Produces:

```js
{
  sql: 'UPDATE foo SET bar = to_timestamp($1), qux = to_timestamp($2)',
  values: [
    'baz',
    'quux'
  ]
}

```

#### Snake-case normalization

`sql.assignmentList` converts object keys to snake-case, e.g.

```js
await connection.query(sql`
  UPDATE foo
  SET ${sql.assignmentList({
    barBaz: sql.raw('to_timestamp($1)', ['qux']),
    quuxQuuz: sql.raw('to_timestamp($1)', ['corge'])
  })}
`);

```

Produces:

```js
{
  sql: 'UPDATE foo SET bar_baz = to_timestamp($1), quux_quuz = to_timestamp($2)',
  values: [
    'qux',
    'corge'
  ]
}

```

This behaviour might be sometimes undesirable.

There is currently no way to override this behaviour.

Use this issue https://github.com/gajus/slonik/issues/53 to describe your use case and propose a solution.

### `sql.json`

```js
(
  value: SerializableValueType
) => JsonTokenType;

```

Serializes value and binds it as an array, e.g.

```js
await connection.query(sql`
  SELECT (${sql.json([1, 2, 3])})
`);

```

Produces:

```js
{
  sql: 'SELECT $1::"json"',
  values: [
    '[1,2,3]'
  ]
}

```

This is a convenience function equivalent to:

```js
await connection.query(sql`
  SELECT (${JSON.stringify([1, 2, 3])}::json})
`);

```
