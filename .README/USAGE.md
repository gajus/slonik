## Usage

### Connection URI

Slonik client is configured using a custom connection URI (DSN).

```json
postgresql://[user[:password]@][host[:port]][/database name][?name=value[&...]]
```

Supported parameters:

|Name|Meaning|Default|
|---|---|---|
|`application_name`|[`application_name`](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-APPLICATION-NAME)||
|`sslmode`|[`sslmode`](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-SSLMODE) (supported values: `disable`, `no-verify`, `require`)|`disable`|

Note that unless listed above, other [libpq parameters](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-PARAMKEYWORDS) are not supported.

Examples of valid DSNs:

```json
postgresql://
postgresql://localhost
postgresql://localhost:5432
postgresql://localhost/foo
postgresql://foo@localhost
postgresql://foo:bar@localhost
postgresql://foo@localhost/bar?application_name=baz
```

Other configurations are available through the [`clientConfiguration` parameter](https://github.com/gajus/slonik#api).

### Create connection

Use `createPool` to create a connection pool, e.g.

```js
import {
  createPool,
} from 'slonik';

const pool = await createPool('postgres://');

```

Instance of Slonik connection pool can be then used to create a new connection, e.g.

```js
pool.connect(async (connection) => {
  await connection.query(sql`SELECT 1`);
});

```

The connection will be kept alive until the promise resolves (the result of the method supplied to `connect()`).

Refer to [query method](#slonik-query-methods) documentation to learn about the connection methods.

If you do not require having a persistent connection to the same backend, then you can directly use `pool` to run queries, e.g.

```js
pool.query(sql`SELECT 1`);

```

Beware that in the latter example, the connection picked to execute the query is a random connection from the connection pool, i.e. using the latter method (without explicit `connect()`) does not guarantee that multiple queries will refer to the same backend.

### End connection pool

Use `pool.end()` to end idle connections and prevent creation of new connections.

The result of `pool.end()` is a promise that is resolved when all connections are ended.

```js
import {
  createPool,
  sql,
} from 'slonik';

const pool = await createPool('postgres://');

const main = async () => {
  await pool.query(sql`
    SELECT 1
  `);

  await pool.end();
};

main();

```

Note: `pool.end()` does not terminate active connections/ transactions.

### Describing the current state of the connection pool

Use `pool.getPoolState()` to find out if pool is alive and how many connections are active and idle, and how many clients are waiting for a connection.

```js
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

```js
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
 * @property connectionTimeout Timeout (in milliseconds) after which an error is raised if connection cannot cannot be established. (Default: 5000)
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

```js
import {
  createPool
} from 'slonik';

const pool = await createPool('postgres://');

await pool.query(sql`SELECT 1`);

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

```js
createPool('postgres://', {
  typeParsers: []
});

```

You can create default type parser collection using `createTypeParserPreset`, e.g.

```js
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
|`connectionTimeout`|Timeout (in milliseconds) after which an error is raised if connection cannot cannot be established.|5000|
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

```js
import {
  createPool,
} from 'slonik';

const pool = await createPool('postgres://localhost');

const result = await pool.connect(async (connection) => {
  await connection.query(sql`SELECT 1`);
  await connection.query(sql`SELECT 2`);

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

```js
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

```js
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
  const results = await connection.query(sql`
    SELECT ${'foo'}
  `);
});

```

## How are they different?

### `pg` vs `slonik`

[`pg`](https://github.com/brianc/node-postgres) is built intentionally to provide unopinionated, minimal abstraction and encourages use of other modules to implement convenience methods.

Slonik is built on top of `pg` and it provides convenience methods for [building queries](#value-placeholders) and [querying data](#slonik-query-methods).

Work on `pg` began on [Tue Sep 28 22:09:21 2010](https://github.com/brianc/node-postgres/commit/cf637b08b79ef93d9a8b9dd2d25858aa7e9f9bdc). It is authored by [Brian Carlson](https://github.com/brianc).

### `pg-promise` vs `slonik`

As the name suggests, [`pg-promise`](https://github.com/vitaly-t/pg-promise) was originally built to enable use of `pg` module with promises (at the time, `pg` only supported Continuation Passing Style (CPS), i.e. callbacks). Since then `pg-promise` added features for connection/ transaction handling, a powerful query-formatting engine and a declarative approach to handling query results.

The primary difference between Slonik and `pg-promise`:

* Slonik does not allow to execute raw text queries. Slonik queries can only be constructed using [`sql` tagged template literals](#slonik-value-placeholders-tagged-template-literals). This design [protects against unsafe value interpolation](#protecting-against-unsafe-value-interpolation).
* Slonik implements [interceptor API](#slonik-interceptors) (middleware). Middlewares allow to modify connection handling, override queries and modify the query results. Example Slonik interceptors include [field name transformation](https://github.com/gajus/slonik-interceptor-field-name-transformation), [query normalization](https://github.com/gajus/slonik-interceptor-query-normalisation) and [query benchmarking](https://github.com/gajus/slonik-interceptor-query-benchmarking).

Note: Author of `pg-promise` has [objected to the above claims](https://github.com/gajus/slonik/issues/122). I have removed a difference that was clearly wrong. I maintain that the above two differences remain valid differences: even though `pg-promise` might have substitute functionality for variable interpolation and interceptors, it implements them in a way that does not provide the same benefits that Slonik provides, namely: guaranteed security and support for extending library functionality using multiple plugins.

Other differences are primarily in how the equivalent features are implemented, e.g.

|`pg-promise`|Slonik|
|---|---|
|[Custom type formatting](https://github.com/vitaly-t/pg-promise#custom-type-formatting).|Not available in Slonik. The current proposal is to create an interceptor that would have access to the [query fragment constructor](https://github.com/gajus/slonik/issues/21).|
|[formatting filters](https://github.com/vitaly-t/pg-promise#nested-named-parameters)|Slonik tagged template [value expressions](https://github.com/gajus/slonik#slonik-value-placeholders) to construct query fragments and bind parameter values.|
|[Query files](https://github.com/vitaly-t/pg-promise#query-files).|Use [`slonik-sql-tag-raw`](https://github.com/gajus/slonik-sql-tag-raw).|
|[Tasks](https://github.com/vitaly-t/pg-promise#tasks).|Use [`pool.connect`](https://github.com/gajus/slonik#slonik-usage-create-connection).|
|Configurable transactions.|Not available in Slonik. Track [this issue](https://github.com/gajus/slonik/issues/30).|
|Events.|Use [interceptors](https://github.com/gajus/slonik#slonik-interceptors).|

When weighting which abstraction to use, it would be unfair not to consider that `pg-promise` is a mature project with dozens of contributors. Meanwhile, Slonik is a young project (started in March 2017) that until recently was developed without active community input. However, if you do support the unique features that Slonik adds, the opinionated API design, and are not afraid of adopting a technology in its young days, then I warmly invite you to adopt Slonik and become a contributor to what I intend to make the standard PostgreSQL client in the Node.js community.

Work on `pg-promise` began [Wed Mar 4 02:00:34 2015](https://github.com/vitaly-t/pg-promise/commit/78fb80f638e7f28b301f75576701536d6b638f31). It is authored by [Vitaly Tomilov](https://github.com/vitaly-t).

### `postgres` vs `slonik`

[`postgres`](https://github.com/porsager/postgres) recently gained in popularity due to its performance benefits when compared to `pg`. In terms of API, it has a pretty bare-bones API that heavily relies on using ES6 tagged templates and abstracts away many concepts of connection pool handling. While `postgres` API might be preferred by some, projects that already use `pg` may have difficulty migrating.

However, by using [postgres-bridge](https://github.com/gajus/postgres-bridge) (`postgres`/`pg` compatibility layer), you can benefit from `postgres` performance improvements while still using Slonik API:

```ts
import postgres from 'postgres';
import { createPostgresBridge } from 'postgres-bridge';
import { createPool } from 'slonik';

const PostgresBridge = createPostgresBridge(postgres);

const pool = await createPool('postgres://', {
  PgPool: PostgresBridge,
});

```