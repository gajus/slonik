## Interceptors

Functionality can be added to Slonik client by adding interceptors (middleware).

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

Interceptors are executed in the order they are added.

### Interceptor methods

Interceptors implement methods that are used to change the behaviour of the database client at different stages of the connection life-cycle:

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
  +beforePoolConnectionRelease?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType
  ) => MaybePromiseType<void>,
  +beforeQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType
  ) => MaybePromiseType<QueryResultType<QueryResultRowType>> | MaybePromiseType<void>,
  +transformQuery?: (
    queryContext: QueryContextType,
    query: QueryType
  ) => MaybePromiseType<QueryType>
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

#### `transformQuery`

Executed before `beforeQueryExecution`.

Transforms query.

## Built-in interceptors

### Field name transformation interceptor

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
import {
  createFieldNameTransformationInterceptor
} from 'slonik';

```

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
  createFieldNameTransformationInterceptor,
  createPool
} from 'slonik';

const interceptors = [
  createFieldNameTransformationInterceptor({
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

### Query normalization interceptor

Normalizes the query.

#### API

```js
import {
  createQueryNormalizationInterceptor
} from 'slonik';

```

```js
/**
 * @property stripComments Strips comments from the query (default: true).
 */
type ConfigurationType = {|
  +stripComments?: boolean
|};

(configuration?: ConfigurationType) => InterceptorType;

```

### Benchmarking interceptor

Summarizes all queries that were run during the life-time of a connection.

Example output:

```
╔═══════════════════════════════════════════════════════════════╤═══════════╤═════════╤═══════╗
║ Query                                                         │ Execution │ Average │ Total ║
║                                                               │ count     │ time    │ time  ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ SELECT id FROM seating_plan WHERE auditorium_id = $1 AND      │ 1         │ 176ms   │ 176ms ║
║ fingerprint = $2                                              │           │         │       ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ UPDATE event SET scrape_event_seating_session = $1,           │ 1         │ 176ms   │ 176ms ║
║ scrape_event_seating_session_created_at = now() WHERE id =    │           │         │       ║
║ $2                                                            │           │         │       ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ SELECT v1.cinema_id "cinemaId",                               │ 1         │ 182ms   │ 182ms ║
║ last_event_seating_plan_change.seating_plan_id                │           │         │       ║
║ "seatingPlanId" FROM event e1 INNER JOIN venue v1 ON v1.id =  │           │         │       ║
║ e1.venue_id INNER JOIN LATERAL ( SELECT DISTINCT ON           │           │         │       ║
║ (espc1.event_id) espc1.seating_plan_id FROM                   │           │         │       ║
║ event_seating_plan_change espc1 WHERE espc1.event_id = e1.id  │           │         │       ║
║ ORDER BY espc1.event_id, espc1.id DESC )                      │           │         │       ║
║ last_event_seating_plan_change ON TRUE WHERE e1.id = $1       │           │         │       ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ UPDATE event_seating_lookup SET ended_at =                    │ 1         │ 185ms   │ 185ms ║
║ statement_timestamp(), log = $1, lookup_is_successful = $2,   │           │         │       ║
║ error_name = $3, error_message = $4, error = $5 WHERE id =    │           │         │       ║
║ $6                                                            │           │         │       ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ SELECT s1.id, s1.location_column "locationColumn",            │ 1         │ 237ms   │ 237ms ║
║ s1.location_row "locationRow", sa1.fuid "seatingAreaFuid"     │           │         │       ║
║ FROM seat s1 INNER JOIN seating_area sa1 ON sa1.id =          │           │         │       ║
║ s1.seating_area_id WHERE s1.seating_plan_id = $1              │           │         │       ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ SELECT extract(epoch from                                     │ 1         │ 647ms   │ 647ms ║
║ (c1.maximum_event_seating_lookup_duration)) FROM event e1     │           │         │       ║
║ INNER JOIN venue v1 ON v1.id = e1.venue_id INNER JOIN cinema  │           │         │       ║
║ c1 ON c1.id = v1.cinema_id WHERE e1.id = $1                   │           │         │       ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ SELECT id FROM cinema_foreign_seat_type WHERE cinema_id = $1  │ 133       │ 150ms   │ 19.9s ║
║ AND fuid = $2                                                 │           │         │       ║
╚═══════════════════════════════════════════════════════════════╧═══════════╧═════════╧═══════╝

```

#### API

```js
import {
  createBenchmarkingInterceptor
} from 'slonik';

```

```js
() => InterceptorType;

```
