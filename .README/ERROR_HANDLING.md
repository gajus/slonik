## Error handling

All Slonik errors extend from `SlonikError`, i.e. You can catch Slonik specific errors using the following logic.

```ts
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

When error originates from `node-postgres`, the original error is available under [`cause` property](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause).

This property is exposed for debugging purposes only. Do not use it for conditional checks – it can change.

If you require to extract meta-data about a specific type of error (e.g. constraint violation name), raise a GitHub issue describing your use case.

### Handling `BackendTerminatedError`

`BackendTerminatedError` is thrown when the backend is terminated by the user, i.e. [`pg_terminate_backend`](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADMIN-SIGNAL).

`BackendTerminatedError` must be handled at the connection level, i.e.

```ts
await pool.connect(async (connection0) => {
  try {
    await pool.connect(async (connection1) => {
      const backendProcessId = await connection1.oneFirst(sql.typeAlias('id')`SELECT pg_backend_pid() AS id`);

      setTimeout(() => {
        connection0.query(sql.typeAlias('void')`SELECT pg_cancel_backend(${backendProcessId})`)
      }, 2000);

      try {
        await connection1.query(sql.typeAlias('void')`SELECT pg_sleep(30)`);
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

```ts
import {
  DataIntegrityError
} from 'slonik';

let row;

try {
  row = await connection.one(sql.typeAlias('foo')`SELECT foo`);
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

```ts
import {
  NotFoundError
} from 'slonik';

let row;

try {
  row = await connection.one(sql.typeAlias('foo')`SELECT foo`);
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

### Handling `StatementCancelledError`

`StatementCancelledError` is thrown when a query is cancelled by the user (i.e. [`pg_cancel_backend`](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADMIN-SIGNAL)) or in case of a timeout.

It should be safe to use the same connection if `StatementCancelledError` is handled, e.g.

```ts
await pool.connect(async (connection0) => {
  await pool.connect(async (connection1) => {
    const backendProcessId = await connection1.oneFirst(sql.typeAlias('id')`SELECT pg_backend_pid() AS id`);

    setTimeout(() => {
      connection0.query(sql.typeAlias('void')`SELECT pg_cancel_backend(${backendProcessId})`)
    }, 2000);

    try {
      await connection1.query(sql.typeAlias('void')`SELECT pg_sleep(30)`);
    } catch (error) {
      if (error instanceof StatementCancelledError) {
        // Safe to continue using the same connection.
      } else {
        throw error;
      }
    }
  });
});
```

### Handling `StatementTimeoutError`

`StatementTimeoutError` inherits from `StatementCancelledError` and it is called only in case of a timeout.

### Handling `UniqueIntegrityConstraintViolationError`

`UniqueIntegrityConstraintViolationError` is thrown when PostgreSQL responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23505`) error.

### Handling `TupleMovedToAnotherPartitionError`

`TupleMovedToAnotherPartitionError` is thrown when [`affecting tuple moved into different partition`](https://github.com/postgres/postgres/commit/f16241bef7cc271bff60e23de2f827a10e50dde8).
