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

### Instance specific errors

You can import instance specific errors from the connection object, e.g.

```js
import {
  createPool
} from 'slonik';

class NotFoundError extends Error {};

const pool = createPool('postgres://', {
  errors: {
    NotFoundError
  }
});

// +errors: {|
//   +CheckIntegrityConstraintViolationError: Class<Error>,
//   +DataIntegrityError: Class<Error>,
//   +ForeignKeyIntegrityConstraintViolationError: Class<Error>,
//   +NotFoundError: Class<Error>,
//   +NotNullIntegrityConstraintViolationError: Class<Error>,
//   +SlonikError: Class<Error>,
//   +UniqueIntegrityConstraintViolationError: Class<Error>
// |},
pool.errors.NotFoundError === NotFoundError;

```

This is useful when the client configuration overrides the default error constructors.

### Handling `NotFoundError`

To handle the case where query returns less than one row, catch `NotFoundError` error.

```js
import {
  NotFoundError
} from 'slonik';

let row;

try {
  row = await connection.one('SELECT foo');
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
  row = await connection.one('SELECT foo');
} catch (error) {
  if (error instanceof DataIntegrityError) {
    console.error('There is more than one row matching the select criteria.');
  } else {
    throw error;
  }
}

```

### Handling `NotNullIntegrityConstraintViolationError`

`NotNullIntegrityConstraintViolationError` is thrown when Postgres responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23502`) error.

### Handling `ForeignKeyIntegrityConstraintViolationError`

`ForeignKeyIntegrityConstraintViolationError` is thrown when Postgres responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23503`) error.

### Handling `UniqueIntegrityConstraintViolationError`

`UniqueIntegrityConstraintViolationError` is thrown when Postgres responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23505`) error.

### Handling `CheckIntegrityConstraintViolationError`

`CheckIntegrityConstraintViolationError` is thrown when Postgres responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23514`) error.

## Types

This package is using [Flow](https://flow.org/) types.

Refer to [`./src/types.js`](./src/types.js).

The public interface exports the following types:

* `DatabaseConnectionType`
* `DatabasePoolConnectionType`
* `DatabaseSingleConnectionType`

Use these types to annotate `connection` instance in your code base, e.g.

```js
// @flow

import type {
  DatabaseConnectionType
} from 'slonik';

export default async (
  connection: DatabaseConnectionType,
  code: string
): Promise<number> => {
  const row = await connection
    .one('SELECT id FROM country WHERE code = ? LIMIT 2', [
      code
    ]);

  return Number(row.id);
};

```
