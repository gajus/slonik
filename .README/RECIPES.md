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
  sql: 'INSERT INTO foo (bar, baz, qux) SELECT * FROM unnest($1::int4[], $2::int4[], $3::int4[])',
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
const slavePool = await createPool('postgres://slave');
const masterPool = await createPool('postgres://master', {
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

### Building Utility Statements

Parameter symbols only work in optimizable SQL commands (SELECT, INSERT, UPDATE, DELETE, and certain commands containing one of these). In other statement types (generically called utility statements, e.g. ALTER, CREATE, DROP and SET), you must insert values textually even if they are just data values.

In the context of Slonik, if you are building utility statements you must use query building methods that interpolate values directly into queries:

* [`sql.identifier`](#slonik-query-building-sql-identifier) – for identifiers.
* [`sql.literalValue`](#slonik-query-building-sql-literalvalue) – for values.

Example:

```js
await connection.query(sql`
  CREATE USER ${sql.identifier(['foo'])}
  WITH PASSWORD ${sql.literalValue('bar')}
`);

```
