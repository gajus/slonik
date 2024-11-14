# Slonik Driver for `pg`

```ts
import {
  createPgDriverFactory,
  DatabaseError,
} from '@slonik/pg-driver';
```

## Error handling

All Slonik errors extend from `SlonikError`. `SlonikError` uses `cause` property to store the original error, which might be a `DatabaseError` from `pg`. Example:

```ts
pool.on('error', (error) => {
  const cause = error.cause;

  if (cause instanceof DatabaseError) {
    console.log(cause.code);
  }
});
```

This allows you to handle errors based on the lower-level error codes provided by `pg` driver.

Example of handling all errors that could warrant a fatal error:

```ts
const fatalErrorClasses = [
  // Connection Exception
  '08',
  // Invalid Authorization Specification
  '28',
];

pool.on('error', (error) => {
  if (error.cause instanceof DatabaseError) {
    const classCode = error.cause.code.slice(0, 2);

    if (fatalErrorClasses.includes(classCode)) {
      // Initiate shutdown due to unexpected connection state.
    }
  }
});
```