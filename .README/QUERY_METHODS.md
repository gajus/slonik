## Query methods

### `any`

Returns result rows.

Example:

```js
const rows = await connection.any('SELECT foo');

```

`#any` is similar to `#query` except that it returns rows without fields information.

### `anyFirst`

Returns value of the first column of every row in the result set.

* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```js
const fooValues = await connection.anyFirst('SELECT foo');

```

### `insert`

Used when inserting 1 row.

Example:

```js
const {
  insertId
} = await connection.insert('INSERT INTO foo SET bar="baz"');

```

The reason for using this method over `#query` is to leverage the strict types. `#insert` method result type is `InsertResultType`.

### `many`

Returns result rows.

* Throws `NotFoundError` if query returns no rows.

Example:

```js
const rows = await connection.many('SELECT foo');

```

### `manyFirst`

Returns value of the first column of every row in the result set.

* Throws `NotFoundError` if query returns no rows.
* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```js
const fooValues = await connection.many('SELECT foo');

```

### `maybeOne`

Selects the first row from the result.

* Returns `null` if row is not found.
* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```js
const row = await connection.maybeOne('SELECT foo');

// row.foo is the result of the `foo` column value of the first row.

```

### `maybeOneFirst`

Returns value of the first column from the first row.

* Returns `null` if row is not found.
* Throws `DataIntegrityError` if query returns multiple rows.
* Throws `DataIntegrityError` if query returns multiple columns.

Example:

```js
const foo = await connection.maybeOneFirst('SELECT foo');

// foo is the result of the `foo` column value of the first row.

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

```js
const foo = await connection.oneFirst('SELECT foo');

// foo is the result of the `foo` column value of the first row.

```

### `query`

API and the result shape are equivalent to [`pg#query`](https://github.com/brianc/node-postgres).

### `transaction`

`transaction` method is used wrap execution of queries in `START TRANSACTION` and `COMMIT` or `ROLLBACK`. `COMMIT` is called if the transaction handler returns a promise that resolves; `ROLLBACK` is called otherwise.

`transaction` method can be used together with `createPool` method. When used to create a transaction from an instance of a pool, a new connection is allocated for the duration of the transaction.

```js
const result = await connection.transaction(async (transactionConnection) => {
  transactionConnection.query(`INSERT INTO foo (bar) VALUES ('baz')`);
  transactionConnection.query(`INSERT INTO qux (quux) VALUES ('quuz')`);

  return 'FOO';
});

result === 'FOO';

```
