# Mightyql

[![Travis build status](http://img.shields.io/travis/gajus/mightyql/master.svg?style=flat-square)](https://travis-ci.org/gajus/mightyql)
[![Coveralls](https://img.shields.io/coveralls/gajus/mightyql.svg?style=flat-square)](https://coveralls.io/github/gajus/mightyql)
[![NPM version](http://img.shields.io/npm/v/mightyql.svg?style=flat-square)](https://www.npmjs.org/package/mightyql)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A PostgreSQL client with strict types and assertions.

* [Usage](#usage)
* [Value placeholders](#value-placeholders)
  * [A value set](#a-value-set)
  * [Multiple value sets](#multiple-value-sets)
  * [Named placeholders](#named-placeholders)
* [Query methods](#query-methods)
  * [`any`](#any)
  * [`insert`](#insert)
  * [`many`](#many)
  * [`maybeOne`](#maybeone)
  * [`one`](#one)
  * [`query`](#query)
* [Overriding Errors](#overriding-errors)
* [Error handling](#error-handling)
  * [Handling `NotFoundError`](#handling-notfounderror)
  * [Handling `DataIntegrityError`](#handling-dataintengrityerror)
  * [Handling `UniqueViolationError`](#handling-uniqueviolationerror)
* [Types](#types)
* [Debugging](#debugging)

## Usage

```js
import {
  createPool
} from 'mightyql';

const connection = createPool({
  host: '127.0.0.1'
});

await connection.query('SELECT 1');

```

## Value placeholders

Mightyql enables use of question mark (`?`) value placeholders, e.g.

```js
await connection.query('SELECT ?', [
  1
]);

```

Question mark value placeholders are converted to positional value placeholders before they are passed to the `pg` driver, i.e. the above query becomes:

```sql
SELECT $1
```

> Do not mix question mark and positional value placeholders in a single query.

### A value set

A question mark is interpolated into a value set when the associated value is an array, e.g.

```js
await connection.query('SELECT ?', [
  [
    1,
    2,
    3
  ]
]);

```

Produces:

```sql
SELECT ($1, $2, $3)

```

### Multiple value sets

A question mark is interpolated into a list of value sets when the associated value is an array of arrays, e.g.

```js
await connection.query('SELECT ?', [
  [
    [
      1,
      2,
      3
    ],
    [
      1,
      2,
      3
    ]
  ]
]);

```

Produces:

```sql
SELECT ($1, $2, $3), ($4, $5, $6)

```

### Named placeholders

A `:[a-zA-Z]` regex is used to match named placeholders.

```js
await connection.query('SELECT :foo', {
  foo: 'FOO'
});

```

Produces:

```sql
SELECT $1

```


## Query methods

### `any`

Returns result rows.

> Similar to `#query` except that it returns rows without fields information.

Example:

```js
const rows = await connection.any('SELECT foo');

```

### `insert`

Designed to use when inserting 1 row.

> The reason for using this method over `#query` is to leverage the strict types.
> `#insert` method result type is `InsertResultType`.

Example:

```js
const {
  insertId
} = await connection.insert('INSERT INTO foo SET bar="baz"');

```

### `many`

Returns result rows.

* Throws `NotFoundError` if query returns no rows.

Example:

```js
const rows = await connection.many('SELECT foo');

```

### `maybeOne`

Selects the first row from the result.

* Returns `null` if row is not found.
* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```js
const row = await connection.one('SELECT foo');

// row.foo is the result of the `foo` column value of the first row.

```

### `one`

Selects the first row from the result.

* Throws `NotFoundError` if query returns no rows.
* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```js
const row = await connection.one('SELECT foo');

// row.foo is the result of the `foo` column value of the first row.

```

> Note:
>
> I've got asked "How is this different from [knex.js](http://knexjs.org/) `knex('foo').limit(1)`".
> `knex('foo').limit(1)` simply generates "SELECT * FROM foo LIMIT 1" query.
> `knex` is a query builder; it does not assert the value of the result.
> Mightyql `one` adds assertions about the result of the query.

### `query`

API and the result shape are equivalent to [`pg#query`](https://github.com/brianc/node-postgres).

## Overriding Errors

Overriding the error constructor used by Mightyql allows you to map database layer errors to your application errors.

```js
import {
  createPool
} from 'mightyql';

class NotFoundError extends Error {};

createPool('postgres://', {
  errors: {
    NotFoundError
  }
});
```

The following error types can be overridden:

* `NotFoundError`

## Error handling

### Handling `NotFoundError`

To handle the case where query returns less than one row, catch `NotFoundError` error.

```js
import {
  NotFoundError
} from 'mightyql';

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
} from 'mightyql';

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

### Handling `UniqueViolationError`

`UniqueViolationError` is thrown when Postgres responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23505`) error.

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
} from 'mightyql';

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

## Debugging

Define `DEBUG=mightyql*` environment variable to enable logging.

Logging includes information about:

* the query thats about to be executed
* placeholder values
* the execution time
* the number of result rows

Here is the output example:

```
mightyql query execution time 196 ms +199ms
mightyql query returned 4 row(s) +0ms
mightyql query SELECT * FROM `movie` WHERE id IN (1000223) +3ms
mightyql values [ 'movie', [ 1000223 ] ] +0ms
mightyql query execution time 28 ms +29ms
mightyql query returned 1 row(s) +0ms
mightyql query SELECT * FROM `movie` WHERE id IN (1000292) +3ms
mightyql values [ 'movie', [ 1000292 ] ] +0ms
mightyql query execution time 24 ms +25ms
mightyql query returned 1 row(s) +0ms
mightyql query SELECT * FROM `movie` WHERE id IN (1000220) +1ms
mightyql values [ 'movie', [ 1000220 ] ] +0ms
mightyql query execution time 26 ms +27ms
mightyql query returned 1 row(s) +0ms
```
