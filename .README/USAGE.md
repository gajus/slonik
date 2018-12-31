## Usage

Slonik exports two factory functions:

* `createPool`
* `createConnection`

The API of the query method is equivalent to that of [`pg`](https://travis-ci.org/brianc/node-postgres).

Refer to [query methods](#slonik-query-methods) for documentation of Slonik-specific query methods.

### Configuration

Both functions accept the same parameters:

* `connectionConfiguration`
* `clientConfiguration`

```js
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
 * @property onConnect A new connection handler. Executed after a connection is established, but before allowing the connection to be used by any clients.
 */
type ClientConfigurationType = {|
  +interceptors?: $ReadOnlyArray<InterceptorType>,
  +onConnect?: (connection: DatabaseConnectionType) => MaybePromiseType<void>
|};

```

Example:

```js
import {
  createPool
} from 'slonik';

const connection = createPool('postgres://localhost');

await connection.query(sql`SELECT 1`);

```
