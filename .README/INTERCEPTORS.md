## Interceptors

Functionality can be added to Slonik client by adding interceptors (middleware).

Interceptors are configured using [client configuration](#api), e.g.

```ts
import {
  createPool
} from 'slonik';

const interceptors = [];

const connection = await createPool('postgres://', {
  interceptors
});
```

Interceptors are executed in the order they are added.

Read: [Default interceptors](#default-interceptors).

### Interceptor methods

Interceptor is an object that implements methods that can change the behaviour of the database client at different stages of the connection life-cycle

```ts
type Interceptor = {
  afterPoolConnection?: (
    connectionContext: ConnectionContext,
    connection: DatabasePoolConnection
  ) => MaybePromise<null>,
  afterQueryExecution?: (
    queryContext: QueryContext,
    query: Query,
    result: QueryResult<QueryResultRow>
  ) => MaybePromise<QueryResult<QueryResultRow>>,
  beforePoolConnection?: (
    connectionContext: ConnectionContext
  ) => MaybePromise<?DatabasePool>,
  beforePoolConnectionRelease?: (
    connectionContext: ConnectionContext,
    connection: DatabasePoolConnection
  ) => MaybePromise<null>,
  beforeQueryExecution?: (
    queryContext: QueryContext,
    query: Query
  ) => MaybePromise<QueryResult<QueryResultRow>> | MaybePromise<null>,
  beforeQueryResult?: (
    queryContext: QueryContext,
    query: Query,
    result: QueryResult<QueryResultRow>
  ) => MaybePromise<null>,
  beforeTransformQuery?: (
    queryContext: QueryContext,
    query: Query
  ) => Promise<null>,
  queryExecutionError?: (
    queryContext: QueryContext,
    query: Query,
    error: SlonikError
  ) => MaybePromise<null>,
  transformQuery?: (
    queryContext: QueryContext,
    query: Query
  ) => Query,
  transformRow?: (
    queryContext: QueryContext,
    query: Query,
    row: QueryResultRow,
    fields: Field[],
  ) => QueryResultRow
};
```

#### `afterPoolConnection`

Executed after a connection is acquired from the connection pool (or a new connection is created), e.g.

```ts
const pool = await createPool('postgres://');

// Interceptor is executed here. ↓
pool.connect();
```

#### `afterQueryExecution`

Executed after query has been executed and before rows were transformed using `transformRow`.

Note: When query is executed using `stream`, then `afterQuery` is called with empty result set.

#### `beforeQueryExecution`

This function can optionally return a direct result of the query which will cause the actual query never to be executed.

#### `beforeQueryResult`

Executed just before the result is returned to the client.

Use this method to capture the result that will be returned to the client.

#### `beforeTransformQuery`

Executed before `transformQuery`. Use this interceptor to capture the original query (e.g. for logging purposes).

#### `beforePoolConnection`

Executed before connection is created.

This function can optionally return a pool to another database, causing a connection to be made to the new pool.

#### `beforePoolConnectionRelease`

Executed before connection is released back to the connection pool, e.g.

```ts
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

### Community interceptors

|Name|Description|
|---|---|
|[`slonik-interceptor-field-name-transformation`](https://github.com/gajus/slonik-interceptor-field-name-transformation)|Transforms Slonik query result field names.|
|[`slonik-interceptor-query-benchmarking`](https://github.com/gajus/slonik-interceptor-query-benchmarking)|Benchmarks Slonik queries.|
|[`slonik-interceptor-query-cache`](https://github.com/gajus/slonik-interceptor-query-cache)|Caches Slonik queries.|
|[`slonik-interceptor-query-logging`](https://github.com/gajus/slonik-interceptor-query-logging)|Logs Slonik queries.|
|[`slonik-interceptor-query-normalisation`](https://github.com/gajus/slonik-interceptor-query-normalisation)|Normalises Slonik queries.|

Check out [`slonik-interceptor-preset`](https://github.com/gajus/slonik-interceptor-preset) for an opinionated collection of interceptors.
