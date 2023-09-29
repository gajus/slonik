## Query methods

### `any`

Returns result rows.

Example:

```ts
const rows = await connection.any(sql.typeAlias('foo')`SELECT foo`);
```

`#any` is similar to `#query` except that it returns rows without fields information.

### `anyFirst`

Returns value of the first column of every row in the result set.

* Throws `DataIntegrityError` if query returns multiple columns.

Example:

```ts
const fooValues = await connection.anyFirst(sql.typeAlias('foo')`SELECT foo`);
```

### `exists`

Returns a boolean value indicating whether query produces results.

The query that is passed to this function is wrapped in `SELECT exists()` prior to it getting executed, i.e.

```ts
pool.exists(sql.typeAlias('void')`
  SELECT
  LIMIT 1
`)
```

is equivalent to:

```ts
pool.oneFirst(sql.unsafe`
  SELECT exists(
    SELECT
    LIMIT 1
  )
`)
```

### `many`

Returns result rows.

* Throws `NotFoundError` if query returns no rows.

Example:

```ts
const rows = await connection.many(sql.typeAlias('foo')`SELECT foo`);
```

### `manyFirst`

Returns value of the first column of every row in the result set.

* Throws `NotFoundError` if query returns no rows.
* Throws `DataIntegrityError` if query returns multiple columns.

Example:

```ts
const fooValues = await connection.many(sql.typeAlias('foo')`SELECT foo`);
```

### `maybeOne`

Selects the first row from the result.

* Returns `null` if row is not found.
* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```ts
const row = await connection.maybeOne(sql.typeAlias('foo')`SELECT foo`);

// row.foo is the result of the `foo` column value of the first row.
```

### `maybeOneFirst`

Returns value of the first column from the first row.

* Returns `null` if row is not found.
* Throws `DataIntegrityError` if query returns multiple rows.
* Throws `DataIntegrityError` if query returns multiple columns.

Example:

```ts
const foo = await connection.maybeOneFirst(sql.typeAlias('foo')`SELECT foo`);

// foo is the result of the `foo` column value of the first row.
```

### `one`

Selects the first row from the result.

* Throws `NotFoundError` if query returns no rows.
* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```ts
const row = await connection.one(sql.typeAlias('foo')`SELECT foo`);

// row.foo is the result of the `foo` column value of the first row.
```

> Note:
>
> I've been asked "What makes this different from [knex.js](http://knexjs.org/) `knex('foo').limit(1)`?".
> `knex('foo').limit(1)` simply generates "SELECT * FROM foo LIMIT 1" query.
> `knex` is a query builder; it does not assert the value of the result.
> Slonik `#one` adds assertions about the result of the query.

### `oneFirst`

Returns value of the first column from the first row.

* Throws `NotFoundError` if query returns no rows.
* Throws `DataIntegrityError` if query returns multiple rows.
* Throws `DataIntegrityError` if query returns multiple columns.

Example:

```ts
const foo = await connection.oneFirst(sql.typeAlias('foo')`SELECT foo`);

// foo is the result of the `foo` column value of the first row.
```

### `query`

API and the result shape are equivalent to [`pg#query`](https://github.com/brianc/node-postgres).

Example:

```ts
await connection.query(sql.typeAlias('foo')`SELECT foo`);

// {
//   command: 'SELECT',
//   fields: [],
//   notices: [],
//   rowCount: 1,
//   rows: [
//     {
//       foo: 'bar'
//     }
//   ]
// }
```

### `stream`

Streams query results.

Example:

```ts
await connection.stream(sql.typeAlias('foo')`SELECT foo`, (stream) => {
  stream.on('data', (row) => {
    row;
    // {
    //   data: {
    //     foo: 'bar'
    //   },
    //   fields: [
    //     {
    //       name: 'foo',
    //       dataTypeId: 23,
    //     }
    //   ]
    // }
  });
});
```

You can also using the [AsyncIterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator) interface:

```ts
await connection.stream(sql.typeAlias('foo')`SELECT foo`, async (stream) => {
  for await (const row of stream) {
    row;
    // {
    //   data: {
    //     foo: 'bar'
    //   },
    //   fields: [
    //     {
    //       name: 'foo',
    //       dataTypeId: 23,
    //     }
    //   ]
    // }
  }
});
```

### `transaction`

`transaction` method is used wrap execution of queries in `START TRANSACTION` and `COMMIT` or `ROLLBACK`. `COMMIT` is called if the transaction handler returns a promise that resolves; `ROLLBACK` is called otherwise.

`transaction` method can be used together with `createPool` method. When used to create a transaction from an instance of a pool, a new connection is allocated for the duration of the transaction.

```ts
const result = await connection.transaction(async (transactionConnection) => {
  await transactionConnection.query(sql.unsafe`INSERT INTO foo (bar) VALUES ('baz')`);
  await transactionConnection.query(sql.unsafe`INSERT INTO qux (quux) VALUES ('corge')`);

  return 'FOO';
});

result === 'FOO';
```

#### Transaction nesting

Slonik uses [`SAVEPOINT`](https://www.postgresql.org/docs/current/sql-savepoint.html) to automatically nest transactions, e.g.

```ts
await connection.transaction(async (t1) => {
  await t1.query(sql.unsafe`INSERT INTO foo (bar) VALUES ('baz')`);

  return t1.transaction((t2) => {
    return t2.query(sql.unsafe`INSERT INTO qux (quux) VALUES ('corge')`);
  });
});
```

is equivalent to:

```sql
START TRANSACTION;
INSERT INTO foo (bar) VALUES ('baz');
SAVEPOINT slonik_savepoint_1;
INSERT INTO qux (quux) VALUES ('corge');
COMMIT;
```

Slonik automatically rollsback to the last savepoint if a query belonging to a transaction results in an error, e.g.

```ts
await connection.transaction(async (t1) => {
  await t1.query(sql.unsafe`INSERT INTO foo (bar) VALUES ('baz')`);

  try {
    await t1.transaction(async (t2) => {
      await t2.query(sql.unsafe`INSERT INTO qux (quux) VALUES ('corge')`);

      return Promise.reject(new Error('foo'));
    });
  } catch (error) {

  }
});
```

is equivalent to:

```sql
START TRANSACTION;
INSERT INTO foo (bar) VALUES ('baz');
SAVEPOINT slonik_savepoint_1;
INSERT INTO qux (quux) VALUES ('corge');
ROLLBACK TO SAVEPOINT slonik_savepoint_1;
COMMIT;
```

If error is unhandled, then the entire transaction is rolledback, e.g.

```ts
await connection.transaction(async (t1) => {
  await t1.query(sql.typeAlias('void')`INSERT INTO foo (bar) VALUES ('baz')`);

  await t1.transaction(async (t2) => {
    await t2.query(sql.typeAlias('void')`INSERT INTO qux (quux) VALUES ('corge')`);

    await t1.transaction(async (t3) => {
      await t3.query(sql.typeAlias('void')`INSERT INTO uier (grault) VALUES ('garply')`);

      return Promise.reject(new Error('foo'));
    });
  });
});
```

is equivalent to:

```sql
START TRANSACTION;
INSERT INTO foo (bar) VALUES ('baz');
SAVEPOINT slonik_savepoint_1;
INSERT INTO qux (quux) VALUES ('corge');
SAVEPOINT slonik_savepoint_2;
INSERT INTO uier (grault) VALUES ('garply');
ROLLBACK TO SAVEPOINT slonik_savepoint_2;
ROLLBACK TO SAVEPOINT slonik_savepoint_1;
ROLLBACK;
```

#### Transaction retrying

Transactions that are failing with [Transaction Rollback](https://www.postgresql.org/docs/current/errcodes-appendix.html) class errors are automatically retried.

A failing transaction will be rolled back and the callback function passed to the transaction method call will be executed again. Nested transactions are also retried until the retry limit is reached. If the nested transaction keeps failing with a [Transaction Rollback](https://www.postgresql.org/docs/current/errcodes-appendix.html) error, then the parent transaction will be retried until the retry limit is reached.

How many times a transaction is retried is controlled using `transactionRetryLimit` configuration (default: 5) and the `transactionRetryLimit` parameter of the `transaction` method (default: undefined). If a `transactionRetryLimit` is given to the method call then it is used otherwise the `transactionRetryLimit` configuration is used.

#### Query retrying

A single query (not part of a transaction) failing with a [Transaction Rollback](https://www.postgresql.org/docs/current/errcodes-appendix.html) class error is automatically retried.

How many times it is retried is controlled by using the `queryRetryLimit` configuration (default: 5).
