# slonik-interceptor-query-logging

[![NPM version](http://img.shields.io/npm/v/slonik-interceptor-query-logging.svg?style=flat-square)](https://www.npmjs.org/package/slonik-interceptor-query-logging)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

Logs [Slonik](https://github.com/gajus/slonik) queries.

## API

```ts
import {
  createQueryLoggingInterceptor
} from 'slonik-interceptor-query-logging';
```

```ts
/**
 * @property logValues Dictates whether to include parameter values used to execute the query. (default: true)
 */
type UserConfigurationType = {|
  +logValues: boolean
|};

(userConfiguration: UserConfigurationType) => InterceptorType;
```

## Example usage

Note: You must export `ROARR_LOG=true` environment variable for logs to be printed. Refer to [Roarr](https://github.com/gajus/roarr) documentation for more information.

```ts
import {
  createPool
} from 'slonik';
import {
  createQueryLoggingInterceptor
} from 'slonik-interceptor-query-logging';

const interceptors = [
  createQueryLoggingInterceptor()
];

const pool = createPool('postgres://', {
  interceptors
});

await connection.any(sql`
  SELECT
    id,
    code_alpha_2
  FROM country
`);
```

Produces log:

```json
{"context":{"package":"slonik","poolId":"01D4G1EHYPYX1DZ073G08QEPED","logLevel":30,"processId":769420982,"stats":{"idleConnectionCount":0,"totalConnectionCount":1,"waitingRequestCount":0}},"message":"created a new client connection","sequence":0,"time":1551021590799,"version":"1.0.0"}
{"context":{"package":"slonik","poolId":"01D4G1EHYPYX1DZ073G08QEPED","logLevel":30,"processId":769420982,"stats":{"idleConnectionCount":0,"totalConnectionCount":1,"waitingRequestCount":0}},"message":"client is checked out from the pool","sequence":1,"time":1551021590801,"version":"1.0.0"}
{"context":{"package":"slonik","poolId":"01D4G1EHYPYX1DZ073G08QEPED","connectionId":"01D4G1EJ8DZFX79EN8CRE5Z7VS","queryId":"01D4G1EJB9P3SJ3V0SSVRTZ800","logLevel":20,"sql":"SELECT id, code_alpha_2 FROM country","stackTrace":[],"values":[]},"message":"executing query","sequence":2,"time":1551021590890,"version":"1.0.0"}
{"context":{"package":"slonik","poolId":"01D4G1EHYPYX1DZ073G08QEPED","connectionId":"01D4G1EJ8DZFX79EN8CRE5Z7VS","queryId":"01D4G1EJB9P3SJ3V0SSVRTZ800","logLevel":20,"executionTime":"65ms","rowCount":250},"message":"query execution result","sequence":3,"time":1551021590918,"version":"1.0.0"}
{"context":{"package":"slonik","poolId":"01D4G1EHYPYX1DZ073G08QEPED","logLevel":30,"processId":769420982,"stats":{"idleConnectionCount":0,"totalConnectionCount":0,"waitingRequestCount":0}},"message":"client connection is closed and removed from the client pool","sequence":4,"time":1551021600922,"version":"1.0.0"}
```

Use [`roarr-cli`](https://github.com/gajus/roarr-cli) to pretty print the logs.

Using `roarr pretty-print` will produce logs in the following format:

```yaml
[2019-02-24T15:19:50.799Z] INFO (30) (@slonik): created a new client connection
poolId:    01D4G1EHYPYX1DZ073G08QEPED
processId: 769420982
stats:
  idleConnectionCount:  0
  totalConnectionCount: 1
  waitingRequestCount:  0

[2019-02-24T15:19:50.801Z] INFO (30) (@slonik): client is checked out from the pool
poolId:    01D4G1EHYPYX1DZ073G08QEPED
processId: 769420982
stats:
  idleConnectionCount:  0
  totalConnectionCount: 1
  waitingRequestCount:  0

[2019-02-24T15:19:50.890Z] DEBUG (20) (@slonik): executing query
poolId:       01D4G1EHYPYX1DZ073G08QEPED
connectionId: 01D4G1EJ8DZFX79EN8CRE5Z7VS
queryId:      01D4G1EJB9P3SJ3V0SSVRTZ800
sql:          SELECT id, code_alpha_2 FROM country
stackTrace:
  (empty array)
values:
  (empty array)

[2019-02-24T15:19:50.918Z] DEBUG (20) (@slonik): query execution result
poolId:        01D4G1EHYPYX1DZ073G08QEPED
connectionId:  01D4G1EJ8DZFX79EN8CRE5Z7VS
queryId:       01D4G1EJB9P3SJ3V0SSVRTZ800
executionTime: 65ms
rowCount:      250

[2019-02-24T15:20:00.922Z] INFO (30) (@slonik): client connection is closed and removed from the client pool
poolId:    01D4G1EHYPYX1DZ073G08QEPED
processId: 769420982
stats:
  idleConnectionCount:  0
  totalConnectionCount: 0
  waitingRequestCount:  0
```

## Logging `auto_explain`

`executionTime` log property describes how long it took for the client to execute the query, i.e. it includes the overhead of waiting for a connection and the network latency, among other things. However, it is possible to get the real query execution time by using [`auto_explain` module](https://www.postgresql.org/docs/current/auto-explain.html).

There are several pre-requisites:

```sql
-- Load the extension.
LOAD 'auto_explain';
-- or (if you are using AWS RDS):
LOAD '$libdir/plugins/auto_explain';

-- Enable logging of all queries.
SET auto_explain.log_analyze=true;
SET auto_explain.log_format=json;
SET auto_explain.log_min_duration=0;
SET auto_explain.log_timing=true;

-- Enables Slonik to capture auto_explain logs.
SET client_min_messages=log;
```

This can be configured using `afterPoolConnection` interceptor, e.g.

```ts
const pool = createPool('postgres://localhost', {
  interceptors: [
    {
      afterPoolConnection: async (connection) => {
        await connection.query(sql`LOAD 'auto_explain'`);
        await connection.query(sql`SET auto_explain.log_analyze=true`);
        await connection.query(sql`SET auto_explain.log_format=json`);
        await connection.query(sql`SET auto_explain.log_min_duration=0`);
        await connection.query(sql`SET auto_explain.log_timing=true`);
        await connection.query(sql`SET client_min_messages=log`);
      }
    }
  ]
});

```

Slonik logging interceptor recognises and parses the `auto_explain` JSON message e.g.

```yaml
[2018-12-31T21:15:21.010Z] INFO (30) (@slonik): notice message
notice:
  level:   notice
  message:
    Query Text: SELECT count(*) FROM actor
    Plan:
      Node Type:           Aggregate
      Strategy:            Plain
      Partial Mode:        Simple
      Parallel Aware:      false
      Startup Cost:        4051.33
      Total Cost:          4051.34
      Plan Rows:           1
      Plan Width:          8
      Actual Startup Time: 26.791
      Actual Total Time:   26.791
      Actual Rows:         1
      Actual Loops:        1
      Plans:
        -
          Node Type:           Seq Scan
          Parent Relationship: Outer
          Parallel Aware:      false
          Relation Name:       actor
          Alias:               actor
          Startup Cost:        0
          Total Cost:          3561.86
          Plan Rows:           195786
          Plan Width:          0
          Actual Startup Time: 0.132
          Actual Total Time:   15.29
          Actual Rows:         195786
          Actual Loops:        1
```
