# 'pg' driver for Slonik

This makes Slonik use [`pg` driver](https://www.npmjs.com/package/pg) to execute PostgreSQL queries.

## Usage

```ts
import {
  createPool,
} from 'slonik';
import {
  createPgDriverFactory,
} from '@slonik/pg-driver';

const slonik = await createPool(
  'postgresql://',
  {
    driverFactory: createPgDriverFactory(),
  },
);
```