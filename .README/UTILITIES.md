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

parseDsn('postgresql://foo@localhost/bar?connect_timeout=10&application_name=baz');
```

### `stringifyDsn`

```ts
(
  connectionOptions: ConnectionOptions,
) => string;
```

Stringifies `ConnectionOptions` to a DSN.

```ts
import {
  stringifyDsn,
} from 'slonik';

stringifyDsn('postgresql://foo@localhost/bar?connect_timeout=10&application_name=baz');
```
