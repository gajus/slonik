## Recipes

### Inserting large number of rows

Slonik provides [`sql.tupleList`](#sqltuplelist) helper function to generate a list of tuples that can be used in the `INSERT` values expression, e.g.

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

There are 2 downsides to this approach:

1. The generated SQL is dynamic and will vary depending on the input.
  * You will not be able to track query stats.
  * Query parsing time increases with the query size.
2. There is a maximum number of parameters that can be bound to the statement (65535).

As an alternative, we can use [`sql.unnest`](#sqlunnest) to create a set of rows using `unnest`. Using the `unnest` approach requires only 1 variable per every column; values for each column are passed as an array, e.g.

```js
await connection.query(sql`
  INSERT INTO (foo, bar, baz)
  SELECT *
  FROM ${sql.unnest(
    [
      [1, 2, 3],
      [4, 5, 6]
    ],
    [
      'int4',
      'int4',
      'int4'
    ]
  )}
`);

```

Produces:

```js
{
  sql: 'INSERT INTO (foo, bar, baz) SELECT * FROM unnest($1::int4[], $2::int4[], $2::int4[])',
  values: [
    [
      1,
      4
    ],
    [
      2,
      5
    ],
    [
      3,
      6
    ]
  ]
}

```

Inserting data this way ensures that the query is stable and reduces the amount of time it takes to parse the query.

### Using `sql.raw` to generate dynamic queries

Warning: Do not use `sql.raw` to concatenate query strings. This defeats the purpose of Slonik. `sql.raw` is available only for hand-crafting complex query fragments (e.g. type expressions). For conditional queries, use `sql.booleanExpression`. For comparison expressions, use `sql.comparisonPredicate`. If you are still unsure how to create a query, then raise an issue to discuss your requirement.

[`sql.raw`](#sqlraw) can be used to generate fragments of an arbitrary SQL that are interpolated into the main query, e.g.

```js
const uniquePairs = [
  ['a', 1],
  ['b', 2]
];

let placeholderIndex = 1;

const whereConditionSql = uniquePairs
  .map(() => {
    return needleColumns
      .map((column) => {
        return column + ' = $' + placeholderIndex++;
      })
      .join(' AND ');
  })
  .join(' OR ');

const values = [];

for (const pairValues of uniquePairs) {
  values.push(...pairValues);
}

const query = sql`
  SELECT
    id
  FROM foo
  WHERE
    ${sql.raw(whereConditionSql, values)}
`;

await connection.any(query);

```

In the above example, `query` is:

```js
{
  sql: 'SELECT id FROM foo WHERE (a = $1 AND b = $2) OR (a = $3 AND b = $4)',
  values: [
    'a',
    1,
    'b',
    2
  ]
}

```

Multiple `sql.raw` fragments can be used to create a query.

### Routing queries to different connections

If connection is initiated by a query (as opposed to a obtained explicitly using `pool#connect()`), then `beforePoolConnection` interceptor can be used to change the pool that will be used to execute the query, e.g.

```js
const slavePool = createPool('postgres://slave');
const masterPool = createPool('postgres://master', {
  interceptors: [
    {
      beforePoolConnection: (connectionContext, pool) => {
        if (connectionContext.query && connectionContext.query.sql.includes('SELECT')) {
          return slavePool;
        }

        return pool;
      }
    }
  ]
});

// This query will use `postgres://slave` connection.
masterPool.query(sql`SELECT 1`);

// This query will use `postgres://master` connection.
masterPool.query(sql`UPDATE 1`);

```
