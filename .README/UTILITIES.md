## Utilities

### `parseDsn`

```ts
(
  dsn: string,
) => ConnectionOptions;
```

Parses DSN to `ConnectionOptions` type.

Example:

```ts
import {
  parseDsn,
} from 'slonik';

parseDsn('postgresql://foo@localhost/bar?application_name=baz');
```

### `stringifyDsn`

```ts
(
  connectionOptions: ConnectionOptions,
) => string;
```

Stringifies `ConnectionOptions` to a DSN.

Example:

```ts
import {
  stringifyDsn,
} from 'slonik';

stringifyDsn({
  host: 'localhost',
  username: 'foo',
  databaseName: 'bar',
  applicationName: 'baz',
});
```
