## Recipes

### Inserting large number of rows

Use [`sql.unnest`](#sqlunnest) to create a set of rows using `unnest`. Using the `unnest` approach requires only 1 variable per every column; values for each column are passed as an array, e.g.

```ts
await connection.query(sql.unsafe`
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

```ts
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

A typical load balancing requirement is to route all "logical" read-only queries to a read-only instance. This requirement can be implemented in 2 ways:

1. Create two instances of Slonik (read-write and read-only) and pass them around the application as needed.
1. Use `beforePoolConnection` middleware to assign query to a connection pool based on the query itself.

First option is preferable as it is the most explicit. However, it also has the most overhead to implement.

On the other hand, `beforePoolConnection` makes it easy to route based on conventions, but carries a greater risk of accidentally routing queries with side-effects to a read-only instance.

The first option is self-explanatory to implement, but this recipe demonstrates my convention for using `beforePoolConnection` to route queries.

Note: How you determine which queries are safe to route to a read-only instance is outside of scope for this documentation.

Note: `beforePoolConnection` only works for connections initiated by a query, i.e. `pool#query` and not `pool#connect()`.

Note: `pool#transaction` triggers `beforePoolConnection` but has no `query`.

Note: This particular implementation does not handle [`SELECT INTO`](https://www.postgresql.org/docs/current/sql-selectinto.html).

```ts
const readOnlyPool = await createPool('postgres://read-only');
const pool = await createPool('postgres://main', {
  interceptors: [
    {
      beforePoolConnection: (connectionContext) => {
        if (!connectionContext.query?.sql.trim().startsWith('SELECT ')) {
          // Returning null falls back to using the DatabasePool from which the query originates.
          return null;
        }

        // This is a convention for the edge-cases where a SELECT query includes a volatile function.
        // Adding a @volatile comment anywhere into the query bypasses the read-only route, e.g.
        // sql.unsafe`
        //   /* @volatile */
        //   SELECT write_log()
        // `
        if (connectionContext.query?.sql.includes('@volatile')) {
          return null;
        }

        // Returning an instance of DatabasePool will attempt to run the query using the other connection pool.
        // Note that all other interceptors of the pool that the query originated from are short-circuited.
        return readOnlyPool;
      }
    }
  ]
});

// This query will use `postgres://read-only` connection.
pool.query(sql.typeAlias('id')`SELECT 1 AS id`);

// This query will use `postgres://main` connection.
pool.query(sql.typeAlias('id')`UPDATE 1 AS id`);
```

### Building Utility Statements

Parameter symbols only work in optimizable SQL commands (SELECT, INSERT, UPDATE, DELETE, and certain commands containing one of these). In other statement types (generically called utility statements, e.g. ALTER, CREATE, DROP and SET), you must insert values textually even if they are just data values.

In the context of Slonik, if you are building utility statements you must use query building methods that interpolate values directly into queries:

* [`sql.identifier`](#slonik-query-building-sql-identifier) – for identifiers.
* [`sql.literalValue`](#slonik-query-building-sql-literalvalue) – for values.

Example:

```ts
await connection.query(sql.typeAlias('void')`
  CREATE USER ${sql.identifier(['foo'])}
  WITH PASSWORD ${sql.literalValue('bar')}
`);
```
