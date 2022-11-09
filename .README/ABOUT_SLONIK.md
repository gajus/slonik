## About Slonik

### Battle-Tested

Slonik began as a collection of utilities designed for working with [`node-postgres`](https://github.com/brianc/node-postgres). It continues to use `node-postgres` driver as it provides a robust foundation for interacting with PostgreSQL. However, what once was a collection of utilities has since grown into a framework that abstracts repeating code patterns, protects against unsafe connection handling and value interpolation, and provides a rich debugging experience.

Slonik has been [battle-tested](https://medium.com/@gajus/lessons-learned-scaling-postgresql-database-to-1-2bn-records-month-edc5449b3067) with large data volumes and queries ranging from simple CRUD operations to data-warehousing needs.

### Origin of the name

![Slonik](./.README/postgresql-elephant.png)

The name of the elephant depicted in the official PostgreSQL logo is Slonik. The name itself is derived from the Russian word for "little elephant".

Read: [The History of Slonik, the PostgreSQL Elephant Logo](https://www.vertabelo.com/blog/notes-from-the-lab/the-history-of-slonik-the-postgresql-elephant-logo)

### Repeating code patterns and type safety

Among the primary reasons for developing Slonik, was the motivation to reduce the repeating code patterns and add a level of type safety. This is primarily achieved through the methods such as `one`, `many`, etc. But what is the issue? It is best illustrated with an example.

Suppose the requirement is to write a method that retrieves a resource ID given values defining (what we assume to be) a unique constraint. If we did not have the aforementioned helper methods available, then it would need to be written as:

```ts
import {
  sql,
  type DatabaseConnection
} from 'slonik';

type DatabaseRecordIdType = number;

const getFooIdByBar = async (connection: DatabaseConnection, bar: string): Promise<DatabaseRecordIdType> => {
  const fooResult = await connection.query(sql.typeAlias('id')`
    SELECT id
    FROM foo
    WHERE bar = ${bar}
  `);

  if (fooResult.rowCount === 0) {
    throw new Error('Resource not found.');
  }

  if (fooResult.rowCount > 1) {
    throw new Error('Data integrity constraint violation.');
  }

  return fooResult[0].id;
};
```

`oneFirst` method abstracts all of the above logic into:

```ts
const getFooIdByBar = (connection: DatabaseConnection, bar: string): Promise<DatabaseRecordIdType> => {
  return connection.oneFirst(sql.typeAlias('id')`
    SELECT id
    FROM foo
    WHERE bar = ${bar}
  `);
};
```

`oneFirst` throws:

* `NotFoundError` if query returns no rows
* `DataIntegrityError` if query returns multiple rows
* `DataIntegrityError` if query returns multiple columns

In the absence of helper methods, the overhead of repeating code becomes particularly visible when writing routines where multiple queries depend on the proceeding query results. Using methods with inbuilt assertions ensures that in case of an error, the error points to the source of the problem. In contrast, unless assertions for all possible outcomes are typed out as in the previous example, the unexpected result of the query will be fed to the next operation. If you are lucky, the next operation will simply break; if you are unlucky, you are risking data corruption and hard-to-locate bugs.

Furthermore, using methods that guarantee the shape of the results allows us to leverage static type checking and catch some of the errors even before executing the code, e.g.

```ts
const fooId = await connection.many(sql.typeAlias('id')`
  SELECT id
  FROM foo
  WHERE bar = ${bar}
`);

await connection.query(sql.typeAlias('void')`
  DELETE FROM baz
  WHERE foo_id = ${fooId}
`);
```

Static type check of the above example will produce a warning as the `fooId` is guaranteed to be an array and binding of the last query is expecting a primitive value.

### Protecting against unsafe connection handling

Slonik only allows to check out a connection for the duration of the promise routine supplied to the `pool#connect()` method.

The primary reason for implementing _only_ this connection pooling method is because the alternative is inherently unsafe, e.g.

```ts
// This is not valid Slonik API

const main = async () => {
  const connection = await pool.connect();

  await connection.query(sql.typeAlias('foo')`SELECT foo()`);

  await connection.release();
};
```

In this example, if `SELECT foo()` produces an error, then connection is never released, i.e. the connection hangs indefinitely.

A fix to the above is to ensure that `connection#release()` is always called, i.e.

```ts
// This is not valid Slonik API

const main = async () => {
  const connection = await pool.connect();

  let lastExecutionResult;

  try {
    lastExecutionResult = await connection.query(sql.typeAlias('foo')`SELECT foo()`);
  } finally {
    await connection.release();
  }

  return lastExecutionResult;
};
```

Slonik abstracts the latter pattern into `pool#connect()` method.

```ts
const main = () => {
  return pool.connect((connection) => {
    return connection.query(sql.typeAlias('foo')`SELECT foo()`);
  });
};
```

Using this pattern, we guarantee that connection is always released as soon as the `connect()` routine resolves or is rejected.

### Protecting against unsafe transaction handling

Just like in the [unsafe connection handling](#protecting-against-unsafe-connection-handling) example, Slonik only allows to create a transaction for the duration of the promise routine supplied to the `connection#transaction()` method.

```ts
connection.transaction(async (transactionConnection) => {
  await transactionConnection.query(sql.typeAlias('void')`INSERT INTO foo (bar) VALUES ('baz')`);
  await transactionConnection.query(sql.typeAlias('void')`INSERT INTO qux (quux) VALUES ('quuz')`);
});
```

This pattern ensures that the transaction is either committed or aborted the moment the promise is either resolved or rejected.

### Protecting against unsafe value interpolation

[SQL injections](https://en.wikipedia.org/wiki/SQL_injection) are one of the most well known attack vectors. Some of the [biggest data leaks](https://en.wikipedia.org/wiki/SQL_injection#Examples) were the consequence of improper user-input handling. In general, SQL injections are easily preventable by using parameterization and by restricting database permissions, e.g.

```ts
// This is not valid Slonik API

connection.query('SELECT $1', [
  userInput
]);
```

In this example, the query text (`SELECT $1`) and parameters (`userInput`) are passed separately to the PostgreSQL server where the parameters are safely substituted into the query. This is a safe way to execute a query using user-input.

The vulnerabilities appear when developers cut corners or when they do not know about parameterization, i.e. there is a risk that someone will instead write:

```ts
// This is not valid Slonik API

connection.query('SELECT \'' + userInput + '\'');
```

As evident by the history of the data leaks, this happens more often than anyone would like to admit. This security vulnerability is especially a significant risk in Node.js community, where a predominant number of developers are coming from frontend and have not had training working with RDBMSes. Therefore, one of the key selling points of Slonik is that it adds multiple layers of protection to prevent unsafe handling of user input.

To begin with, Slonik does not allow running plain-text queries.

```ts
// This is not valid Slonik API

connection.query('SELECT 1');
```

The above invocation would produce an error:

> TypeError: Query must be constructed using `sql` tagged template literal.

This means that the only way to run a query is by constructing it using [`sql` tagged template literal](https://github.com/gajus/slonik#slonik-value-placeholders-tagged-template-literals), e.g.

```ts
connection.query(sql.unsafe`SELECT 1`);
```

To add a parameter to the query, user must use [template literal placeholders](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Description), e.g.

```ts
connection.query(sql.unsafe`SELECT ${userInput}`);
```

Slonik takes over from here and constructs a query with value bindings, and sends the resulting query text and parameters to PostgreSQL. There is no other way of passing parameters to the query – this adds a strong layer of protection against accidental unsafe user input handling due to limited knowledge of the SQL client API.

As Slonik restricts user's ability to generate and execute dynamic SQL, it provides helper functions used to generate fragments of the query and the corresponding value bindings, e.g. [`sql.identifier`](#sqlidentifier), [`sql.join`](#sqljoin) and [`sql.unnest`](#sqlunnest). These methods generate tokens that the query executor interprets to construct a safe query, e.g.

```ts
connection.query(sql.unsafe`
  SELECT ${sql.identifier(['foo', 'a'])}
  FROM (
    VALUES
    (
      ${sql.join(
        [
          sql.join(['a1', 'b1', 'c1'], sql.fragment`, `),
          sql.join(['a2', 'b2', 'c2'], sql.fragment`, `)
        ],
        sql.fragment`), (`
      )}
    )
  ) foo(a, b, c)
  WHERE foo.b IN (${sql.join(['c1', 'a2'], sql.fragment`, `)})
`);
```

This (contrived) example generates a query equivalent to:

```sql
SELECT "foo"."a"
FROM (
  VALUES
    ($1, $2, $3),
    ($4, $5, $6)
) foo(a, b, c)
WHERE foo.b IN ($7, $8)
```

This query is executed with the parameters provided by the user.

To sum up, Slonik is designed to prevent accidental creation of queries vulnerable to SQL injections.
