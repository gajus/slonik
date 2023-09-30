## Usage

### Connection URI

Slonik client is configured using a custom connection URI (DSN).

```tson
postgresql://[user[:password]@][host[:port]][/database name][?name=value[&...]]
```

Supported parameters:

|Name|Meaning|Default|
|---|---|---|
|`application_name`|[`application_name`](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-APPLICATION-NAME)||
|`sslmode`|[`sslmode`](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-SSLMODE) (supported values: `disable`, `no-verify`, `require`)|`disable`|

Note that unless listed above, other [libpq parameters](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-PARAMKEYWORDS) are not supported.

Examples of valid DSNs:

```text
postgresql://
postgresql://localhost
postgresql://localhost:5432
postgresql://localhost/foo
postgresql://foo@localhost
postgresql://foo:bar@localhost
postgresql://foo@localhost/bar?application_name=baz
```

Unix-domain socket connection is chosen if the host part is either empty or looks like an absolute path name.

```text
postgresql:///dbname?host=/var/lib/postgresql
postgresql://%2Fvar%2Flib%2Fpostgresql/dbname
```

Other configurations are available through the [`clientConfiguration` parameter](https://github.com/gajus/slonik#api).

### Create connection

Use `createPool` to create a connection pool, e.g.

```ts
import {
  createPool,
} from 'slonik';

const pool = await createPool('postgres://');
```

> **Note:** If you are new to Slonik, then you should read [Integrating Slonik with Express.js](https://dev.to/gajus/integrating-slonik-with-expressjs-33kn).

Instance of Slonik connection pool can be then used to create a new connection, e.g.

```ts
pool.connect(async (connection) => {
  await connection.query(sql.typeAlias('id')`SELECT 1 AS id`);
});
```

The connection will be kept alive until the promise resolves (the result of the method supplied to `connect()`).

Refer to [query method](#slonik-query-methods) documentation to learn about the connection methods.

If you do not require having a persistent connection to the same backend, then you can directly use `pool` to run queries, e.g.

```ts
pool.query(sql.typeAlias('id')`SELECT 1 AS id`);
```

Beware that in the latter example, the connection picked to execute the query is a random connection from the connection pool, i.e. using the latter method (without explicit `connect()`) does not guarantee that multiple queries will refer to the same backend.

### End connection pool

Use `pool.end()` to end idle connections and prevent creation of new connections.

The result of `pool.end()` is a promise that is resolved when all connections are ended.

```ts
import {
  createPool,
  sql,
} from 'slonik';

const pool = await createPool('postgres://');

const main = async () => {
  await pool.query(sql.typeAlias('id')`
    SELECT 1 AS id
  `);

  await pool.end();
};

main();
```

Note: `pool.end()` does not terminate active connections/ transactions.

### Describing the current state of the connection pool

Use `pool.getPoolState()` to find out if pool is alive and how many connections are active and idle, and how many clients are waiting for a connection.

```ts
import {
  createPool,
  sql,
} from 'slonik';

const pool = await createPool('postgres://');

const main = async () => {
  pool.getPoolState();

  // {
  //   activeConnectionCount: 0,
  //   ended: false,
  //   idleConnectionCount: 0,
  //   waitingClientCount: 0,
  // }

  await pool.connect(() => {
    pool.getPoolState();

    // {
    //   activeConnectionCount: 1,
    //   ended: false,
    //   idleConnectionCount: 0,
    //   waitingClientCount: 0,
    // }
  });

  pool.getPoolState();

  // {
  //   activeConnectionCount: 0,
  //   ended: false,
  //   idleConnectionCount: 1,
  //   waitingClientCount: 0,
  // }

  await pool.end();

  pool.getPoolState();

  // {
  //   activeConnectionCount: 0,
  //   ended: true,
  //   idleConnectionCount: 0,
  //   waitingClientCount: 0,
  // }
};

main();
```

Note: `pool.end()` does not terminate active connections/ transactions.

### API

```ts
/**
 * @param connectionUri PostgreSQL [Connection URI](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING).
 */
createPool(
  connectionUri: string,
  clientConfiguration: ClientConfiguration
): DatabasePool;

/**
 * @property captureStackTrace Dictates whether to capture stack trace before executing query. Middlewares access stack trace through query execution context. (Default: false)
 * @property connectionRetryLimit Number of times to retry establishing a new connection. (Default: 3)
 * @property connectionTimeout Timeout (in milliseconds) after which an error is raised if connection cannot be established. (Default: 5000)
 * @property idleInTransactionSessionTimeout Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000)
 * @property idleTimeout Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 5000)
 * @property interceptors An array of [Slonik interceptors](https://github.com/gajus/slonik#slonik-interceptors).
 * @property maximumPoolSize Do not allow more than this many connections. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 10)
 * @property PgPool Override the underlying PostgreSQL Pool constructor.
 * @property queryRetryLimit Number of times a query failing with Transaction Rollback class error, that doesn't belong to a transaction, is retried. (Default: 5)
 * @property ssl [tls.connect options](https://nodejs.org/api/tls.html#tlsconnectoptions-callback)
 * @property statementTimeout Timeout (in milliseconds) after which database is instructed to abort the query. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000)
 * @property transactionRetryLimit Number of times a transaction failing with Transaction Rollback class error is retried. (Default: 5)
 * @property typeParsers An array of [Slonik type parsers](https://github.com/gajus/slonik#slonik-type-parsers).
 */
type ClientConfiguration = {
  captureStackTrace?: boolean,
  connectionRetryLimit?: number,
  connectionTimeout?: number | 'DISABLE_TIMEOUT',
  idleInTransactionSessionTimeout?: number | 'DISABLE_TIMEOUT',
  idleTimeout?: number | 'DISABLE_TIMEOUT',
  interceptors?: Interceptor[],
  maximumPoolSize?: number,
  PgPool?: new (poolConfig: PoolConfig) => PgPool,
  queryRetryLimit?: number,
  ssl?: Parameters<tls.connect>[0],
  statementTimeout?: number | 'DISABLE_TIMEOUT',
  transactionRetryLimit?: number,
  typeParsers?: TypeParser[],
};
```

Example:

```ts
import {
  createPool
} from 'slonik';

const pool = await createPool('postgres://');

await pool.query(sql.typeAlias('id')`SELECT 1 AS id`);
```

### Default configuration

#### Default interceptors

None.

Check out [`slonik-interceptor-preset`](https://github.com/gajus/slonik-interceptor-preset) for an opinionated collection of interceptors.

#### Default type parsers

These type parsers are enabled by default:

|Type name|Implementation|
|---|---|
|`date`|Produces a literal date as a string (format: YYYY-MM-DD).|
|`int8`|Produces an integer.|
|`interval`|Produces interval in seconds (integer).|
|`numeric`|Produces a float.|
|`timestamp`|Produces a unix timestamp (in milliseconds).|
|`timestamptz`|Produces a unix timestamp (in milliseconds).|

To disable the default type parsers, pass an empty array, e.g.

```ts
createPool('postgres://', {
  typeParsers: []
});
```

You can create default type parser collection using `createTypeParserPreset`, e.g.

```ts
import {
  createTypeParserPreset
} from 'slonik';

createPool('postgres://', {
  typeParsers: [
    ...createTypeParserPreset()
  ]
});
```

#### Default timeouts

There are 4 types of configurable timeouts:

|Configuration|Description|Default|
|---|---|---|
|`connectionTimeout`|Timeout (in milliseconds) after which an error is raised if connection cannot be established.|5000|
|`idleInTransactionSessionTimeout`|Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout.|60000|
|`idleTimeout`|Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout.|5000|
|`statementTimeout`|Timeout (in milliseconds) after which database is instructed to abort the query. Use 'DISABLE_TIMEOUT' constant to disable the timeout.|60000|

Slonik sets aggressive timeouts by default. These timeouts are designed to provide safe interface to the database. These timeouts might not work for all programs. If your program has long running statements, consider adjusting timeouts just for those statements instead of changing the defaults.

#### Known limitations of using pg-native with Slonik

* notice logs are not captured in `notices` query result property (`notice` event is never fired on connection instance).
* cannot combine multiple commands into a single statement (pg-native limitation [#88](https://github.com/brianc/node-pg-native/issues/88))
* does not support streams.

### Checking out a client from the connection pool

Slonik only allows to check out a connection for the duration of the promise routine supplied to the `pool#connect()` method.

```ts
import {
  createPool,
} from 'slonik';

const pool = await createPool('postgres://localhost');

const result = await pool.connect(async (connection) => {
  await connection.query(sql.typeAlias('id')`SELECT 1 AS id`);
  await connection.query(sql.typeAlias('id')`SELECT 2 AS id`);

  return 'foo';
});

result;
// 'foo'

```

Connection is released back to the pool after the promise produced by the function supplied to `connect()` method is either resolved or rejected.

Read: [Protecting against unsafe connection handling](#protecting-against-unsafe-connection-handling)

### Mocking Slonik

Slonik provides a way to mock queries against the database.

* Use `createMockPool` to create a mock connection.
* Use `createMockQueryResult` to create a mock query result.

```ts
import {
  createMockPool,
  createMockQueryResult,
} from 'slonik';

type OverridesType =
  query: (sql: string, values: PrimitiveValueExpression[],) => Promise<QueryResult<QueryResultRow>>,
};

createMockPool(overrides: OverridesType): DatabasePool;
createMockQueryResult(rows: QueryResultRow[]): QueryResult<QueryResultRow>;
```

Example:

```ts
import {
  createMockPool,
  createMockQueryResult,
} from 'slonik';

const pool = createMockPool({
  query: async () => {
    return createMockQueryResult([
      {
        foo: 'bar',
      },
    ]);
  },
});

await pool.connect(async (connection) => {
  const results = await connection.query(sql.typeAlias('foo')`
    SELECT ${'foo'} AS foo
  `);
});
```
