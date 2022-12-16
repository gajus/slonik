## Type parsers

Type parsers describe how to parse PostgreSQL types.

```ts
type TypeParser = {
  name: string,
  parse: (value: string) => *
};
```

Example:

```ts
{
  name: 'int8',
  parse: (value) => {
    return parseInt(value, 10);
  }
}
```

Note: Unlike [`pg-types`](https://github.com/brianc/node-pg-types) that uses OIDs to identify types, Slonik identifies types using their names.

Use this query to find type names:

```sql
SELECT typname
FROM pg_type
ORDER BY typname ASC
```

Type parsers are configured using [`typeParsers` client configuration](#slonik-usage-api).

Read: [Default type parsers](#default-type-parsers).

### Built-in type parsers

|Type name|Implementation|Factory function name|
|---|---|---|
|`date`|Produces a literal date as a string (format: YYYY-MM-DD).|`createDateTypeParser`|
|`int8`|Produces an integer.|`createBigintTypeParser`|
|`interval`|Produces interval in seconds (integer).|`createIntervalTypeParser`|
|`numeric`|Produces a float.|`createNumericTypeParser`|
|`timestamp`|Produces a unix timestamp (in milliseconds).|`createTimestampTypeParser`|
|`timestamptz`|Produces a unix timestamp (in milliseconds).|`createTimestampWithTimeZoneTypeParser`|

Built-in type parsers can be created using the exported factory functions, e.g.

```ts
import {
  createTimestampTypeParser
} from 'slonik';

createTimestampTypeParser();

// {
//   name: 'timestamp',
//   parse: (value) => {
//     return value === null ? value : Date.parse(value + ' UTC');
//   }
// }
```
