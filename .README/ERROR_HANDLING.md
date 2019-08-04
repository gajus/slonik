## Error handling

All Slonik errors extend from `SlonikError`, i.e. You can catch Slonik specific errors using the following logic.

```js
import {
  SlonikError
} from 'slonik';

try {
  await query();
} catch (error) {
  if (error instanceof SlonikError) {
    // This error is thrown by Slonik.
  }
}

```

### Original `node-postgres` error

When error originates from `node-postgres`, the original error is available under `originalError` property.

This propery is exposed for debugging purposes only. Do not use it for conditional checks – it can change.

If you require to extract meta-data about a specific type of error (e.g. contraint violation name), raise a GitHub issue describing your use case.

### Handling `BackendTerminatedError`

`BackendTerminatedError` is thrown when the backend is terminated by the user, i.e. [`pg_terminate_backend`](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADMIN-SIGNAL).

`BackendTerminatedError` must be handled at the connection level, i.e.

```js
await pool.connect(async (connection0) => {
  try {
    await pool.connect(async (connection1) => {
      const backendProcessId = await connection1.oneFirst(sql`SELECT pg_backend_pid()`);

      setTimeout(() => {
        connection0.query(sql`SELECT pg_cancel_backend(${backendProcessId})`)
      }, 2000);

      try {
        await connection1.query(sql`SELECT pg_sleep(30)`);
      } catch (error) {
        // This code will not be executed.
      }
    });
  } catch (error) {
    if (error instanceof BackendTerminatedError) {
      // Handle backend termination.
    } else {
      throw error;
    }
  }
});

```

### Handling `CheckIntegrityConstraintViolationError`

`CheckIntegrityConstraintViolationError` is thrown when PostgreSQL responds with [`check_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23514`) error.

### Handling `ConnectionError`

`ConnectionError` is thrown when connection cannot be established to the PostgreSQL server.

### Handling `DataIntegrityError`

To handle the case where the data result does not match the expectations, catch `DataIntegrityError` error.

```js
import {
  NotFoundError
} from 'slonik';

let row;

try {
  row = await connection.one(sql`SELECT foo`);
} catch (error) {
  if (error instanceof DataIntegrityError) {
    console.error('There is more than one row matching the select criteria.');
  } else {
    throw error;
  }
}

```

### Handling `ForeignKeyIntegrityConstraintViolationError`

`ForeignKeyIntegrityConstraintViolationError` is thrown when PostgreSQL responds with [`foreign_key_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23503`) error.

### Handling `NotFoundError`

To handle the case where query returns less than one row, catch `NotFoundError` error.

```js
import {
  NotFoundError
} from 'slonik';

let row;

try {
  row = await connection.one(sql`SELECT foo`);
} catch (error) {
  if (!(error instanceof NotFoundError)) {
    throw error;
  }
}

if (row) {
  // row.foo is the result of the `foo` column value of the first row.
}

```

### Handling `NotNullIntegrityConstraintViolationError`

`NotNullIntegrityConstraintViolationError` is thrown when PostgreSQL responds with [`not_null_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23502`) error.

### Handling `QueryCancelledError`

`QueryCancelledError` is thrown when a query is cancelled by the user, i.e. [`pg_cancel_backend`](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADMIN-SIGNAL).

It should be safe to use the same connection if the `QueryCancelledError` is handled, e.g.

```js
await pool.connect(async (connection0) => {
  await pool.connect(async (connection1) => {
    const backendProcessId = await connection1.oneFirst(sql`SELECT pg_backend_pid()`);

    setTimeout(() => {
      connection0.query(sql`SELECT pg_cancel_backend(${backendProcessId})`)
    }, 2000);

    try {
      await connection1.query(sql`SELECT pg_sleep(30)`);
    } catch (error) {
      if (error instanceof QueryCancelledError) {
        // Safe to continue using the same connection.
      } else {
        throw error;
      }
    }
  });
});

```

### Handling `UniqueIntegrityConstraintViolationError`

`UniqueIntegrityConstraintViolationError` is thrown when PostgreSQL responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23505`) error.
