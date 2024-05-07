# slonik-sql-tag-raw

[![NPM version](http://img.shields.io/npm/v/slonik-sql-tag-raw.svg?style=flat-square)](https://www.npmjs.org/package/slonik-sql-tag-raw)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

[Slonik](https://github.com/gajus/slonik) SQL tag for constructing dynamic queries.

## Warning

There are no known use cases for generating queries using `raw` that aren't covered by nesting bound `sql` expressions or by one of the other existing [query building methods](#slonik-query-building). `raw` exists only as a mechanism to execute externally stored _static_ queries (e.g. queries stored in files).

## Usage

```js
import {
  raw,
} from 'slonik-sql-tag-raw';

```

### `raw`

```js
(
  sql: string,
  values?: $ReadOnlyArray<PrimitiveValueExpressionType>
) => RawSqlTokenType;

```

Raw/ dynamic SQL can be inlined using `raw`, e.g.

```js
sql`
  SELECT 1
  FROM ${raw('"bar"')}
`;

```

Produces:

```js
{
  sql: 'SELECT 1 FROM "bar"',
  values: []
}

```

The second parameter of the `raw` can be used to bind [positional parameter](https://www.postgresql.org/docs/current/sql-expressions.html#SQL-EXPRESSIONS-PARAMETERS-POSITIONAL) values, e.g.

```js
sql`
  SELECT ${raw('$1', [1])}
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

#### Named parameters

`raw` supports named parameters, e.g.

```js
sql`
  SELECT ${raw(':foo, :bar', {bar: 'BAR', foo: 'FOO'})}
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