## Interceptors

Functionality can be added to Slonik client by adding interceptors.

Each interceptor can implement several functions which can be used to change the behaviour of the database client.

```js
type InterceptorType = {|
  +beforeQuery?: (query: QueryType) => Promise<QueryResultType<QueryResultRowType>> | QueryResultType<QueryResultRowType> | MaybePromiseType<void>,
  +afterQuery?: (query: QueryType, result: QueryResultType<QueryResultRowType>) => MaybePromiseType<QueryResultType<QueryResultRowType>>
|};

```

Interceptors are configured using [client configuration](#slonik-usage-configuration), e.g.

```js
import {
  createPool
} from 'slonik';

const interceptors = [];

const connection = createPool('postgres://', {
  interceptors
});

```

There are 2 functions that an interceptor can implement:

* beforeQuery
* afterQuery

Interceptors are executed in the order they are added.

### `beforeQuery`

`beforeQuery` is the first interceptor function executed.

This function can optionally return a direct result of the query which will cause the actual query never to be executed.

### `afterQuery`

`afterQuery` is the last interceptor function executed.

This function must return the result of the query, which will be passed down to the client.

Use `afterQuery` to modify the query result.
