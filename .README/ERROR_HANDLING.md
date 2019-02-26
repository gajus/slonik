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

### Handling `ConnectionError`

`ConnectionError` is thrown when connection cannot be established to the PostgreSQL server.

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

### Handling `NotNullIntegrityConstraintViolationError`

`NotNullIntegrityConstraintViolationError` is thrown when PostgreSQL responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23502`) error.

### Handling `ForeignKeyIntegrityConstraintViolationError`

`ForeignKeyIntegrityConstraintViolationError` is thrown when PostgreSQL responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23503`) error.

### Handling `UniqueIntegrityConstraintViolationError`

`UniqueIntegrityConstraintViolationError` is thrown when PostgreSQL responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23505`) error.

### Handling `CheckIntegrityConstraintViolationError`

`CheckIntegrityConstraintViolationError` is thrown when PostgreSQL responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23514`) error.
