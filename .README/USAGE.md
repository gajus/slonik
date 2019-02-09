## Usage

Slonik exports two factory functions:

* `createPool`
* `createConnection`

The API of the query method is equivalent to that of [`pg`](https://travis-ci.org/brianc/node-postgres).

Refer to [query methods](#slonik-query-methods) for documentation of Slonik-specific query methods.

### API

```js
createPool(connectionConfiguration: DatabaseConfigurationType, clientConfiguration: ClientConfigurationType): DatabasePoolType;
createConnection(connectionConfiguration: DatabaseConfigurationType, clientConfiguration: ClientConfigurationType): DatabaseSingleConnectionType;

type DatabaseConnectionUriType = string;

type DatabaseConfigurationType =
  DatabaseConnectionUriType |
  {|
    +database?: string,
    +host?: string,
    +idleTimeoutMillis?: number,
    +max?: number,
    +password?: string,
    +port?: number,
    +user?: string
  |};

/**
 * @property interceptors An array of [Slonik interceptors](https://github.com/gajus/slonik#slonik-interceptors).
 */
type ClientConfigurationType = {|
  +interceptors?: $ReadOnlyArray<InterceptorType>
|};

```

Example:

```js
import {
  createPool
} from 'slonik';

const pool = createPool('postgres://localhost');

await pool.query(sql`SELECT 1`);

```

### Checking out a client from the connection pool

Slonik only allows to check out a connection for a duration of promise routine supplied to the `connect()` method.

```js
import {
  createPool
} from 'slonik';

const pool = createPool('postgres://localhost');

const result = await pool.connect(async (connection) => {
  await connection.query(sql`SELECT 1`);
  await connection.query(sql`SELECT 2`);

  return 'foo';
});

result;
// 'foo'

```

Connection is released back to the pool after the promise produced by the function supplied to `connect()` method is either resolved or rejected.

The primary reason for implementing _only_ this connection pooling method is because the alternative is inherently unsafe, e.g.

```js
// Note: This example is using unsupported API.

const main = async () => {
  const connection = await pool.connect();

  await connection.query(sql`SELECT produce_error()`);

  await connection.release();
};

```

In this example, the error causes early rejection of the promise and a hanging connection. A fix to the above is to ensure that `connection#release()` is always called, i.e.

```js
// Note: This example is using unsupported API.

const main = async () => {
  const connection = await pool.connect();

  let lastExecutionResult;

  try {
    lastExecutionResult = await connection.query(sql`SELECT produce_error()`);
  } finally {
    await connection.release();
  }

  return lastExecutionResult;
};

```

Slonik abstracts the latter pattern into `pool#connect()` method.
