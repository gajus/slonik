---
"@slonik/pg-driver": minor
"slonik": minor
---

fix: `stream()` rejects with the error of a `transformRow` or `transformRowAsync` interceptor (e.g. a `SchemaValidationError` of a result parser). Previously, the error was an unhandled rejection, `stream()` never settled, and the connection was never released. `stream()` also waits for the promise returned by the stream handler (e.g. an `async` function that uses `for await`). When the consumer of a stream fails, the driver closes the cursor, so that the connection can be used again (e.g. to roll back the transaction).
