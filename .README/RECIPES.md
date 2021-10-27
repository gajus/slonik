## Recipes

### Inserting large number of rows

Use [`sql.unnest`](#sqlunnest) to create a set of rows using `unnest`. Using the `unnest` approach requires only 1 variable per every column; values for each column are passed as an array, e.g.

```js
await connection.query(sql`
  INSERT INTO foo (bar, baz, qux)
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
  sql: 'INSERT INTO foo (bar, baz, qux) SELECT * FROM unnest($1::int4[], $2::int4[], $2::int4[])',
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

### Building a dynamic query

To build a query dynamically, assemble the dynamic portions of the query inside of a `sql` tag. You can then combine those clauses inside of other `sql`tags to be used to execute queries.

For example:

```js
const field1 = 1;
const field2Clause = someValue ? sql` and field2=${someValue}` : sql``;
const finalQuery = sql`SELECT * FROM table WHERE field1=${field1}${field2Clause}`;
```
