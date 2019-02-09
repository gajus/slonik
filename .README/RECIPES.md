## Recipes

### Logging `auto_explain`

`executionTime` log property describes how long it took for the client to execute the query, i.e. it includes the overhead of waiting for a connection and the network latency, among other things. However, it is possible to get the real query execution time by using [`auto_explain` module](https://www.postgresql.org/docs/current/auto-explain.html).

There are several pre-requisites:

```sql
-- Load the extension.
LOAD 'auto_explain';
-- or (if you are using AWS RDS):
LOAD '$libdir/plugins/auto_explain';

-- Enable logging of all queries.
SET auto_explain.log_analyze=true;
SET auto_explain.log_format=json;
SET auto_explain.log_min_duration=0;
SET auto_explain.log_timing=true;

-- Enables Slonik to capture auto_explain logs.
SET client_min_messages=log;

```

This can be configured using `afterPoolConnection` interceptor, e.g.



```js
const pool = await createPool('postgres://localhost', {
  interceptors: [
    {
      afterPoolConnection: async (connection) => {
        await connection.query(sql`LOAD 'auto_explain'`);
        await connection.query(sql`SET auto_explain.log_analyze=true`);
        await connection.query(sql`SET auto_explain.log_format=json`);
        await connection.query(sql`SET auto_explain.log_min_duration=0`);
        await connection.query(sql`SET auto_explain.log_timing=true`);
        await connection.query(sql`SET client_min_messages=log`);
      }
    }
  ]
});

```

Slonik recognises and parses the `auto_explain` JSON message; Roarr logger will produce a pretty-print of the explain output, e.g.

```yaml
[2018-12-31T21:15:21.010Z] INFO (30) (@slonik): notice message
notice:
  level:   notice
  message:
    Query Text: SELECT count(*) FROM actor
    Plan:
      Node Type:           Aggregate
      Strategy:            Plain
      Partial Mode:        Simple
      Parallel Aware:      false
      Startup Cost:        4051.33
      Total Cost:          4051.34
      Plan Rows:           1
      Plan Width:          8
      Actual Startup Time: 26.791
      Actual Total Time:   26.791
      Actual Rows:         1
      Actual Loops:        1
      Plans:
        -
          Node Type:           Seq Scan
          Parent Relationship: Outer
          Parallel Aware:      false
          Relation Name:       actor
          Alias:               actor
          Startup Cost:        0
          Total Cost:          3561.86
          Plan Rows:           195786
          Plan Width:          0
          Actual Startup Time: 0.132
          Actual Total Time:   15.29
          Actual Rows:         195786
          Actual Loops:        1

```

### Using `sql.raw` to generate dynamic queries

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
