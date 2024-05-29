# slonik-interceptor-query-cache

[![NPM version](http://img.shields.io/npm/v/slonik-interceptor-query-cache.svg?style=flat-square)](https://www.npmjs.org/package/slonik-interceptor-query-cache)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

Caches [Slonik](https://github.com/gajus/slonik) query results.

## Usage

Query cache interceptor is initialized using a custom storage service. The [Example Usage](#example-usage) documentation shows how to create a compatible storage service using [`node-cache`](https://www.npmjs.com/package/node-cache).

Which queries are cached is controlled using cache attributes. Cache attributes are comments starting with `-- @cache-` prefix. Only queries with cache attributes are cached (see [Cache attributes](#cache-attributes))

## Behavior

* Does not cache queries inside of a transaction.

## Cache attributes

#### `@cache-ttl`

|Required|Format|Default|
|---|---|---|
|Yes|`/^d+$/`|N/A|

Number (in seconds) to cache the query for.

#### `@cache-key`

|Required|Format|Default|
|---|---|---|
|No|`/^[$A-Za-z0-9\-_:]+$/`|`$bodyHash:$valueHash`|

Cache key that uniquely identifies the query.

If present, `$bodyHash` is substituted with the hash of the query (comments and white-spaces are stripped before hashing the query).

If present, `$valueHash` is substituted with the hash of the parameter values.

#### `@cache-discard-empty`

|Required|Format|Default|
|---|---|---|
|No|`/^(false\|true)$/`|`false`|

If set to `true`, then `storage.set` is not invoked when query produces no results.

### Example usage

This example shows how to create a compatible storage service using [`node-cache`](https://www.npmjs.com/package/node-cache).

```js
import NodeCache from 'node-cache';
import {
  createPool
} from 'slonik';
import {
  createQueryCacheInterceptor
} from 'slonik-interceptor-query-cache';

const nodeCache = new NodeCache({
  checkperiod: 60,
  stdTTL: 60,
  useClones: false,
});

const pool = await createPool('postgres://', {
  interceptors: [
    createQueryCacheInterceptor({
      storage: {
        get: (query, cacheAttributes) => {
          // Returning null results in the query being executed.
          return cache.get(cacheAttributes.key) || null;
        },
        set: (query, cacheAttributes, queryResult) => {
          cache.set(cacheAttributes.key, queryResult, cacheAttributes.ttl);
        },
      },
    }),
  ]
});
```

These are example queries:

```ts
// Caches the query results based on a combination of the query hash and the parameter value hash.
await connection.any(sql`
  -- @cache-ttl 60
  SELECT
    id,
    code_alpha_2
  FROM country
  WHERE
    code_alpha_2 = ${countryCode}
`);

// Does not cache the result when query produces no results.
await connection.any(sql`
  -- @cache-ttl 60
  -- @cache-discard-empty true
  SELECT
    id,
    code_alpha_2
  FROM country
  WHERE
    code_alpha_2 = ${countryCode}
`);

// Caches the query results based only on the parameter value hash.
await connection.any(sql`
  -- @cache-ttl 60
  -- @cache-key $bodyHash
  SELECT
    id,
    code_alpha_2
  FROM country
  WHERE
    code_alpha_2 = ${countryCode}
`);

// Caches the query results using 'foo' key.
await connection.any(sql`
  -- @cache-ttl 60
  -- @cache-key foo
  SELECT
    id,
    code_alpha_2
  FROM country
  WHERE
    code_alpha_2 = ${countryCode}
`);
```