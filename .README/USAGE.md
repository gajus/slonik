## Usage

Slonik exports two factory functions:

* `createPool`
* `createConnection`

Example:

```js
import {
  createPool
} from 'slonik';

const connection = createPool({
  host: '127.0.0.1'
});

await connection.query('SELECT 1');

```

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

type ClientConfigurationType = {|
  +interceptors?: $ReadOnlyArray<InterceptorType>
|};

```
