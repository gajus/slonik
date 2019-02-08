## Interceptors

Functionality can be added to Slonik client by adding interceptors.

Each interceptor can implement several functions which can be used to change the behaviour of the database client.

```js
type InterceptorType = {|
  +afterQuery?: (query: QueryType, result: QueryResultType<QueryResultRowType>) => MaybePromiseType<QueryResultType<QueryResultRowType>>,
  +beforeConnectionEnd?: (connection: DatabaseSingleConnectionType) => MaybePromiseType<void>,
  +beforePoolConnectionRelease?: (connection: DatabasePoolConnectionType) => MaybePromiseType<void>,
  +beforeQuery?: (query: QueryType) => Promise<QueryResultType<QueryResultRowType>> | QueryResultType<QueryResultRowType> | MaybePromiseType<void>
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

* `beforeQuery`
* `beforeConnectionEnd`
* `beforePoolConnectionRelease`
* `afterQuery`

Interceptors are executed in the order they are added.

### `beforeQuery`

`beforeQuery` is the first interceptor function executed in the query execution cycle.

This function can optionally return a direct result of the query which will cause the actual query never to be executed.

### `beforeConnectionEnd`

`beforeConnectionEnd` is executed before a connection is explicitly ended, e.g.

```js
const connection = await createConnection('postgres://');

// Interceptor is executed here. ↓
connection.end();

```

### `beforePoolConnectionRelease`

`beforePoolConnectionRelease` is executed before connection is released back to the connection pool, e.g.

```js
const pool = await createPool('postgres://');

pool.connect(async () => {
  await 1;

  // Interceptor is executed here. ↓
});

```

### `afterQuery`

`afterQuery` is the last interceptor function executed in the query execution cycle.

This function must return the result of the query, which will be passed down to the client.

Use `afterQuery` to modify the query result.

## Built-in interceptors

### Field name formatter

`createFormatFieldNameInterceptor` creates an interceptor that formats query result field names.

This interceptor removes the necessity to alias field names, e.g.

```js
connection.any(sql`
  SELECT
    id,
    full_name "fullName"
  FROM person
`);

```

Field name formatter uses `afterQuery` interceptor to format field names.

#### API

```js
/**
 * @property format The only supported format is CAMEL_CASE.
 * @property test Tests whether the field should be formatted. The default behaviour is to include all fields that match ^[a-z0-9_]+$ regex.
 */
type ConfigurationType = {|
  +format: 'CAMEL_CASE',
  +test: (field: FieldType) => boolean
|};

(configuration: ConfigurationType) => InterceptorType;

```

#### Example usage

```js
import {
  createFormatFieldNameInterceptor,
  createPool
} from 'slonik';

const interceptors = [
  createFormatFieldNameInterceptor({
    format: 'CAMEL_CASE'
  })
];

const connection = createPool('postgres://', {
  interceptors
});

connection.any(sql`
  SELECT
    id,
    full_name
  FROM person
`);

// [
//   {
//     id: 1,
//     fullName: 1
//   }
// ]

```
