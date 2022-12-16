## Debugging

### Logging

Slonik uses [roarr](https://github.com/gajus/roarr) to log queries.

To enable logging, define `ROARR_LOG=true` environment variable.

By default, Slonik logs only connection events, e.g. when connection is created, connection is acquired and notices.

Query-level logging can be added using [`slonik-interceptor-query-logging`](https://github.com/gajus/slonik-interceptor-query-logging) interceptor.

### Capture stack trace

Note: Requires [`slonik-interceptor-query-logging`](https://github.com/gajus/slonik-interceptor-query-logging).

Enabling `captureStackTrace` configuration will create a stack trace before invoking the query and include the stack trace in the logs, e.g.

```tson
{
  "context": {
    "package": "slonik",
    "namespace": "slonik",
    "logLevel": 20,
    "executionTime": "357 ms",
    "queryId": "01CV2V5S4H57KCYFFBS0BJ8K7E",
    "rowCount": 1,
    "sql": "SELECT schedule_cinema_data_task();",
    "stackTrace": [
      "/node_modules/slonik/dist:162:28",
      "/node_modules/slonik/dist:314:12",
      "/node_modules/slonik/dist:361:20",
      "/node_modules/slonik/dist/utilities:17:13",
      "/src/bin/commands/do-cinema-data-tasks.js:59:21",
      "/src/bin/commands/do-cinema-data-tasks.js:590:45",
      "internal/process/next_tick.js:68:7"
    ],
    "values": []
  },
  "message": "query",
  "sequence": 4,
  "time": 1540915127833,
  "version": "1.0.0"
}
{
  "context": {
    "package": "slonik",
    "namespace": "slonik",
    "logLevel": 20,
    "executionTime": "66 ms",
    "queryId": "01CV2V5SGS0WHJX4GJN09Z3MTB",
    "rowCount": 1,
    "sql": "SELECT cinema_id \"cinemaId\", target_data \"targetData\" FROM cinema_data_task WHERE id = ?",
    "stackTrace": [
      "/node_modules/slonik/dist:162:28",
      "/node_modules/slonik/dist:285:12",
      "/node_modules/slonik/dist/utilities:17:13",
      "/src/bin/commands/do-cinema-data-tasks.js:603:26",
      "internal/process/next_tick.js:68:7"
    ],
    "values": [
      17953947
    ]
  },
  "message": "query",
  "sequence": 5,
  "time": 1540915127902,
  "version": "1.0.0"
}
```

Use [`@roarr/cli`](https://github.com/gajus/roarr-cli) to pretty-print the output.

![Log Roarr pretty-print output.](./.README/log-roarr-pretty-print-output.png)
