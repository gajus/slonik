## Interceptors

Functionality can be added to Slonik client by adding interceptors (middleware).

Interceptors are configured using [client configuration](#api), e.g.

```js
import {
  createPool
} from 'slonik';

const interceptors = [];

const connection = createPool('postgres://', {
  interceptors
});

```

Interceptors are executed in the order they are added.

Read: [Default interceptors](#default-interceptors).

### Interceptor methods

Interceptor is an object that implements methods that can change the behaviour of the database client at different stages of the connection life-cycle

```js
type InterceptorType = {|
  +afterPoolConnection?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType
  ) => MaybePromiseType<void>,
  +afterQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType,
    result: QueryResultType<QueryResultRowType>
  ) => MaybePromiseType<QueryResultType<QueryResultRowType>>,
  +beforePoolConnection?: (
    connectionContext: ConnectionContextType
  ) => MaybePromiseType<?DatabasePoolType>,
  +beforePoolConnectionRelease?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType
  ) => MaybePromiseType<void>,
  +beforeQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType
  ) => MaybePromiseType<QueryResultType<QueryResultRowType>> | MaybePromiseType<void>,
  +queryExecutionError?: (
    queryContext: QueryContextType,
    query: QueryType,
    error: SlonikError
  ) => MaybePromiseType<void>,
  +transformQuery?: (
    queryContext: QueryContextType,
    query: QueryType
  ) => QueryType,
  +transformRow?: (
    queryContext: QueryContextType,
    query: QueryType,
    row: QueryResultRowType,
    fields: $ReadOnlyArray<FieldType>
  ) => QueryResultRowType
|};

```

#### `afterPoolConnection`

Executed after a connection is acquired from the connection pool (or a new connection is created), e.g.

```js
const pool = createPool('postgres://');

// Interceptor is executed here. ↓
pool.connect();

```

#### `afterQueryExecution`

`afterQueryExecution` must return the result of the query, which will be passed down to the client.

Use `afterQuery` to modify the query result.

Note: When query is executed using `stream`, then `afterQuery` is called with empty result set and does not affect the query result.

#### `beforeQueryExecution`

This function can optionally return a direct result of the query which will cause the actual query never to be executed.

#### `beforePoolConnectionRelease`

Executed before connection is released back to the connection pool, e.g.

```js
const pool = await createPool('postgres://');

pool.connect(async () => {
  await 1;

  // Interceptor is executed here. ↓
});

```

#### `queryExecutionError`

Executed if query execution produces an error.

Use `queryExecutionError` to log and/ or re-throw another error.

#### `transformQuery`

Executed before `beforeQueryExecution`.

Transforms query.

#### `transformRow`

Executed for each row.

Transforms row.

Use `transformRow` to modify the query result.

## Community interceptors

|Name|Description|
|---|---|
|[`slonik-interceptor-field-name-transformation`](https://github.com/gajus/slonik-interceptor-field-name-transformation)|Transforms Slonik query result field names.|
|[`slonik-interceptor-query-benchmarking`](https://github.com/gajus/slonik-interceptor-query-benchmarking)|Benchmarks Slonik queries.|
|[`slonik-interceptor-query-logging`](https://github.com/gajus/slonik-interceptor-query-logging)|Logs Slonik queries.|
|[`slonik-interceptor-query-normalisation`](https://github.com/gajus/slonik-interceptor-query-normalisation)|Normalises Slonik queries.|

Check out [`slonik-interceptor-preset`](https://github.com/gajus/slonik-interceptor-preset) for an opinionated collection of interceptors.
