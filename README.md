<a name="user-content-slonik"></a>
<a name="slonik"></a>
# Slonik

[![Travis build status](http://img.shields.io/travis/gajus/slonik/master.svg?style=flat-square)](https://travis-ci.com/github/gajus/slonik)
[![Coveralls](https://img.shields.io/coveralls/gajus/slonik.svg?style=flat-square)](https://coveralls.io/github/gajus/slonik)
[![NPM version](http://img.shields.io/npm/v/slonik.svg?style=flat-square)](https://www.npmjs.org/package/slonik)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A [battle-tested](#user-content-battle-tested) Node.js PostgreSQL client with strict types, detailed logging and assertions.

![Tailing Slonik logs](./.README/slonik-log-tailing.gif)

(The above GIF shows Slonik producing [query logs](https://github.com/gajus/slonik#logging). Slonik produces logs using [Roarr](https://github.com/gajus/roarr). Logs include stack trace of the actual query invocation location and values used to execute the query.)

<a name="user-content-slonik-sponsors"></a>
<a name="slonik-sponsors"></a>
## Sponsors

If you value my work and want to see Slonik and [many other of my](https://github.com/gajus/) Open-Source projects to be continuously improved, then please consider becoming a patron:

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/gajus)
[![Become a Patron](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/gajus)

<a name="user-content-slonik-principles"></a>
<a name="slonik-principles"></a>
## Principles

* Promotes writing raw SQL.
* Discourages ad-hoc dynamic generation of SQL.

Read: [Stop using Knex.js](https://medium.com/@gajus/bf410349856c)

Note: Using this project does not require TypeScript. It is a regular ES6 module. Ignore the type definitions used in the documentation if you do not use a type system.

<a name="user-content-slonik-features"></a>
<a name="slonik-features"></a>
## Features

* [Runtime validation](#user-content-runtime-validation)
* [Assertions and type safety](#user-content-repeating-code-patterns-and-type-safety).
* [Connection mocking](#user-content-mocking-slonik).
* [Safe connection handling](#user-content-protecting-against-unsafe-connection-handling).
* [Safe transaction handling](#user-content-protecting-against-unsafe-transaction-handling).
* [Safe value interpolation](#user-content-protecting-against-unsafe-value-interpolation).
* [Transaction nesting](#user-content-transaction-nesting).
* [Transaction retrying](#user-content-transaction-retrying)
* [Query retrying](#user-content-query-retrying)
* Detailed [logging](#user-content-slonik-debugging).
* [Asynchronous stack trace resolution](#user-content-capture-stack-trace).
* [Middlewares](#user-content-slonik-interceptors).
* [Mapped errors](#user-content-error-handling).
* [ESLint plugin](https://github.com/gajus/eslint-plugin-sql).

<a name="user-content-slonik-contents"></a>
<a name="slonik-contents"></a>
## Contents

* [Slonik](#user-content-slonik)
    * [Sponsors](#user-content-slonik-sponsors)
    * [Principles](#user-content-slonik-principles)
    * [Features](#user-content-slonik-features)
    * [Contents](#user-content-slonik-contents)
    * [About Slonik](#user-content-slonik-about-slonik)
        * [Battle-Tested](#user-content-slonik-about-slonik-battle-tested)
        * [Origin of the name](#user-content-slonik-about-slonik-origin-of-the-name)
        * [Repeating code patterns and type safety](#user-content-slonik-about-slonik-repeating-code-patterns-and-type-safety)
        * [Protecting against unsafe connection handling](#user-content-slonik-about-slonik-protecting-against-unsafe-connection-handling)
        * [Protecting against unsafe transaction handling](#user-content-slonik-about-slonik-protecting-against-unsafe-transaction-handling)
        * [Protecting against unsafe value interpolation](#user-content-slonik-about-slonik-protecting-against-unsafe-value-interpolation)
    * [Documentation](#user-content-slonik-documentation)
    * [Usage](#user-content-slonik-usage)
        * [Connection URI](#user-content-slonik-usage-connection-uri)
        * [Create connection](#user-content-slonik-usage-create-connection)
        * [End connection pool](#user-content-slonik-usage-end-connection-pool)
        * [Describing the current state of the connection pool](#user-content-slonik-usage-describing-the-current-state-of-the-connection-pool)
        * [API](#user-content-slonik-usage-api)
        * [Default configuration](#user-content-slonik-usage-default-configuration)
        * [Checking out a client from the connection pool](#user-content-slonik-usage-checking-out-a-client-from-the-connection-pool)
        * [Mocking Slonik](#user-content-slonik-usage-mocking-slonik)
    * [How are they different?](#user-content-slonik-how-are-they-different)
        * [`pg` vs `slonik`](#user-content-slonik-how-are-they-different-pg-vs-slonik)
        * [`pg-promise` vs `slonik`](#user-content-slonik-how-are-they-different-pg-promise-vs-slonik)
        * [`postgres` vs `slonik`](#user-content-slonik-how-are-they-different-postgres-vs-slonik)
    * [Type parsers](#user-content-slonik-type-parsers)
        * [Built-in type parsers](#user-content-slonik-type-parsers-built-in-type-parsers)
    * [Interceptors](#user-content-slonik-interceptors)
        * [Interceptor methods](#user-content-slonik-interceptors-interceptor-methods)
        * [Community interceptors](#user-content-slonik-interceptors-community-interceptors)
    * [Recipes](#user-content-slonik-recipes)
        * [Inserting large number of rows](#user-content-slonik-recipes-inserting-large-number-of-rows)
        * [Routing queries to different connections](#user-content-slonik-recipes-routing-queries-to-different-connections)
        * [Building Utility Statements](#user-content-slonik-recipes-building-utility-statements)
    * [Runtime validation](#user-content-slonik-runtime-validation)
        * [Motivation](#user-content-slonik-runtime-validation-motivation)
        * [Example use of `sql.type`](#user-content-slonik-runtime-validation-example-use-of-sql-type)
        * [Performance penalty](#user-content-slonik-runtime-validation-performance-penalty)
        * [Unknown keys](#user-content-slonik-runtime-validation-unknown-keys)
        * [Handling schema validation errors](#user-content-slonik-runtime-validation-handling-schema-validation-errors)
        * [Inferring types](#user-content-slonik-runtime-validation-inferring-types)
        * [Transforming results](#user-content-slonik-runtime-validation-transforming-results)
        * [Result parser interceptor](#user-content-slonik-runtime-validation-result-parser-interceptor)
    * [`sql` tag](#user-content-slonik-sql-tag)
        * [Type aliases](#user-content-slonik-sql-tag-type-aliases)
        * [Typing `sql` tag](#user-content-slonik-sql-tag-typing-sql-tag)
    * [Value placeholders](#user-content-slonik-value-placeholders)
        * [Tagged template literals](#user-content-slonik-value-placeholders-tagged-template-literals)
        * [Manually constructing the query](#user-content-slonik-value-placeholders-manually-constructing-the-query)
        * [Nesting `sql`](#user-content-slonik-value-placeholders-nesting-sql)
    * [Query building](#user-content-slonik-query-building)
        * [`sql.array`](#user-content-slonik-query-building-sql-array)
        * [`sql.binary`](#user-content-slonik-query-building-sql-binary)
        * [`sql.date`](#user-content-slonik-query-building-sql-date)
        * [`sql.fragment`](#user-content-slonik-query-building-sql-fragment)
        * [`sql.identifier`](#user-content-slonik-query-building-sql-identifier)
        * [`sql.interval`](#user-content-slonik-query-building-sql-interval)
        * [`sql.join`](#user-content-slonik-query-building-sql-join)
        * [`sql.json`](#user-content-slonik-query-building-sql-json)
        * [`sql.jsonb`](#user-content-slonik-query-building-sql-jsonb)
        * [`sql.literalValue`](#user-content-slonik-query-building-sql-literalvalue)
        * [`sql.timestamp`](#user-content-slonik-query-building-sql-timestamp)
        * [`sql.unnest`](#user-content-slonik-query-building-sql-unnest)
        * [`sql.unsafe`](#user-content-slonik-query-building-sql-unsafe)
    * [Query methods](#user-content-slonik-query-methods)
        * [`any`](#user-content-slonik-query-methods-any)
        * [`anyFirst`](#user-content-slonik-query-methods-anyfirst)
        * [`exists`](#user-content-slonik-query-methods-exists)
        * [`copyFromBinary`](#user-content-slonik-query-methods-copyfrombinary)
        * [`many`](#user-content-slonik-query-methods-many)
        * [`manyFirst`](#user-content-slonik-query-methods-manyfirst)
        * [`maybeOne`](#user-content-slonik-query-methods-maybeone)
        * [`maybeOneFirst`](#user-content-slonik-query-methods-maybeonefirst)
        * [`one`](#user-content-slonik-query-methods-one)
        * [`oneFirst`](#user-content-slonik-query-methods-onefirst)
        * [`query`](#user-content-slonik-query-methods-query)
        * [`stream`](#user-content-slonik-query-methods-stream)
        * [`transaction`](#user-content-slonik-query-methods-transaction)
    * [Utilities](#user-content-slonik-utilities)
        * [`parseDsn`](#user-content-slonik-utilities-parsedsn)
        * [`stringifyDsn`](#user-content-slonik-utilities-stringifydsn)
    * [Error handling](#user-content-slonik-error-handling)
        * [Original `node-postgres` error](#user-content-slonik-error-handling-original-node-postgres-error)
        * [Handling `BackendTerminatedError`](#user-content-slonik-error-handling-handling-backendterminatederror)
        * [Handling `CheckIntegrityConstraintViolationError`](#user-content-slonik-error-handling-handling-checkintegrityconstraintviolationerror)
        * [Handling `ConnectionError`](#user-content-slonik-error-handling-handling-connectionerror)
        * [Handling `DataIntegrityError`](#user-content-slonik-error-handling-handling-dataintegrityerror)
        * [Handling `ForeignKeyIntegrityConstraintViolationError`](#user-content-slonik-error-handling-handling-foreignkeyintegrityconstraintviolationerror)
        * [Handling `NotFoundError`](#user-content-slonik-error-handling-handling-notfounderror)
        * [Handling `NotNullIntegrityConstraintViolationError`](#user-content-slonik-error-handling-handling-notnullintegrityconstraintviolationerror)
        * [Handling `StatementCancelledError`](#user-content-slonik-error-handling-handling-statementcancellederror)
        * [Handling `StatementTimeoutError`](#user-content-slonik-error-handling-handling-statementtimeouterror)
        * [Handling `UniqueIntegrityConstraintViolationError`](#user-content-slonik-error-handling-handling-uniqueintegrityconstraintviolationerror)
        * [Handling `TupleMovedToAnotherPartitionError`](#user-content-slonik-error-handling-handling-tuplemovedtoanotherpartitionerror)
    * [Migrations](#user-content-slonik-migrations)
    * [Types](#user-content-slonik-types)
    * [Debugging](#user-content-slonik-debugging)
        * [Logging](#user-content-slonik-debugging-logging)
        * [Capture stack trace](#user-content-slonik-debugging-capture-stack-trace)
    * [Syntax Highlighting](#user-content-slonik-syntax-highlighting)
        * [Atom Syntax Highlighting Plugin](#user-content-slonik-syntax-highlighting-atom-syntax-highlighting-plugin)
        * [VS Code Syntax Highlighting Extension](#user-content-slonik-syntax-highlighting-vs-code-syntax-highlighting-extension)
    * [Development](#user-content-slonik-development)


<a name="user-content-slonik-about-slonik"></a>
<a name="slonik-about-slonik"></a>
## About Slonik

<a name="user-content-slonik-about-slonik-battle-tested"></a>
<a name="slonik-about-slonik-battle-tested"></a>
### Battle-Tested

Slonik began as a collection of utilities designed for working with [`node-postgres`](https://github.com/brianc/node-postgres). It continues to use `node-postgres` driver as it provides a robust foundation for interacting with PostgreSQL. However, what once was a collection of utilities has since grown into a framework that abstracts repeating code patterns, protects against unsafe connection handling and value interpolation, and provides a rich debugging experience.

Slonik has been [battle-tested](https://medium.com/@gajus/lessons-learned-scaling-postgresql-database-to-1-2bn-records-month-edc5449b3067) with large data volumes and queries ranging from simple CRUD operations to data-warehousing needs.

<a name="user-content-slonik-about-slonik-origin-of-the-name"></a>
<a name="slonik-about-slonik-origin-of-the-name"></a>
### Origin of the name

![Slonik](./.README/postgresql-elephant.png)

The name of the elephant depicted in the official PostgreSQL logo is Slonik. The name itself is derived from the Russian word for "little elephant".

Read: [The History of Slonik, the PostgreSQL Elephant Logo](https://www.vertabelo.com/blog/notes-from-the-lab/the-history-of-slonik-the-postgresql-elephant-logo)

<a name="user-content-slonik-about-slonik-repeating-code-patterns-and-type-safety"></a>
<a name="slonik-about-slonik-repeating-code-patterns-and-type-safety"></a>
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

<a name="user-content-slonik-about-slonik-protecting-against-unsafe-connection-handling"></a>
<a name="slonik-about-slonik-protecting-against-unsafe-connection-handling"></a>
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

<a name="user-content-slonik-about-slonik-protecting-against-unsafe-transaction-handling"></a>
<a name="slonik-about-slonik-protecting-against-unsafe-transaction-handling"></a>
### Protecting against unsafe transaction handling

Just like in the [unsafe connection handling](#user-content-protecting-against-unsafe-connection-handling) example, Slonik only allows to create a transaction for the duration of the promise routine supplied to the `connection#transaction()` method.

```ts
connection.transaction(async (transactionConnection) => {
  await transactionConnection.query(sql.typeAlias('void')`INSERT INTO foo (bar) VALUES ('baz')`);
  await transactionConnection.query(sql.typeAlias('void')`INSERT INTO qux (quux) VALUES ('quuz')`);
});
```

This pattern ensures that the transaction is either committed or aborted the moment the promise is either resolved or rejected.

<a name="user-content-slonik-about-slonik-protecting-against-unsafe-value-interpolation"></a>
<a name="slonik-about-slonik-protecting-against-unsafe-value-interpolation"></a>
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

As Slonik restricts user's ability to generate and execute dynamic SQL, it provides helper functions used to generate fragments of the query and the corresponding value bindings, e.g. [`sql.identifier`](#user-content-sqlidentifier), [`sql.join`](#user-content-sqljoin) and [`sql.unnest`](#user-content-sqlunnest). These methods generate tokens that the query executor interprets to construct a safe query, e.g.

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


<a name="user-content-slonik-documentation"></a>
<a name="slonik-documentation"></a>
## Documentation

<a name="user-content-slonik-usage"></a>
<a name="slonik-usage"></a>
## Usage

<a name="user-content-slonik-usage-connection-uri"></a>
<a name="slonik-usage-connection-uri"></a>
### Connection URI

Slonik client is configured using a custom connection URI (DSN).

```tson
postgresql://[user[:password]@][host[:port]][/database name][?name=value[&...]]
```

Supported parameters:

|Name|Meaning|Default|
|---|---|---|
|`application_name`|[`application_name`](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-APPLICATION-NAME)||
|`sslmode`|[`sslmode`](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-SSLMODE) (supported values: `disable`, `no-verify`, `require`)|`disable`|

Note that unless listed above, other [libpq parameters](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-PARAMKEYWORDS) are not supported.

Examples of valid DSNs:

```text
postgresql://
postgresql://localhost
postgresql://localhost:5432
postgresql://localhost/foo
postgresql://foo@localhost
postgresql://foo:bar@localhost
postgresql://foo@localhost/bar?application_name=baz
```

Other configurations are available through the [`clientConfiguration` parameter](https://github.com/gajus/slonik#api).

<a name="user-content-slonik-usage-create-connection"></a>
<a name="slonik-usage-create-connection"></a>
### Create connection

Use `createPool` to create a connection pool, e.g.

```ts
import {
  createPool,
} from 'slonik';

const pool = await createPool('postgres://');
```

Instance of Slonik connection pool can be then used to create a new connection, e.g.

```ts
pool.connect(async (connection) => {
  await connection.query(sql.typeAlias('id')`SELECT 1 AS id`);
});
```

The connection will be kept alive until the promise resolves (the result of the method supplied to `connect()`).

Refer to [query method](#user-content-slonik-query-methods) documentation to learn about the connection methods.

If you do not require having a persistent connection to the same backend, then you can directly use `pool` to run queries, e.g.

```ts
pool.query(sql.typeAlias('id')`SELECT 1 AS id`);
```

Beware that in the latter example, the connection picked to execute the query is a random connection from the connection pool, i.e. using the latter method (without explicit `connect()`) does not guarantee that multiple queries will refer to the same backend.

<a name="user-content-slonik-usage-end-connection-pool"></a>
<a name="slonik-usage-end-connection-pool"></a>
### End connection pool

Use `pool.end()` to end idle connections and prevent creation of new connections.

The result of `pool.end()` is a promise that is resolved when all connections are ended.

```ts
import {
  createPool,
  sql,
} from 'slonik';

const pool = await createPool('postgres://');

const main = async () => {
  await pool.query(sql.typeAlias('id')`
    SELECT 1 AS id
  `);

  await pool.end();
};

main();
```

Note: `pool.end()` does not terminate active connections/ transactions.

<a name="user-content-slonik-usage-describing-the-current-state-of-the-connection-pool"></a>
<a name="slonik-usage-describing-the-current-state-of-the-connection-pool"></a>
### Describing the current state of the connection pool

Use `pool.getPoolState()` to find out if pool is alive and how many connections are active and idle, and how many clients are waiting for a connection.

```ts
import {
  createPool,
  sql,
} from 'slonik';

const pool = await createPool('postgres://');

const main = async () => {
  pool.getPoolState();

  // {
  //   activeConnectionCount: 0,
  //   ended: false,
  //   idleConnectionCount: 0,
  //   waitingClientCount: 0,
  // }

  await pool.connect(() => {
    pool.getPoolState();

    // {
    //   activeConnectionCount: 1,
    //   ended: false,
    //   idleConnectionCount: 0,
    //   waitingClientCount: 0,
    // }
  });

  pool.getPoolState();

  // {
  //   activeConnectionCount: 0,
  //   ended: false,
  //   idleConnectionCount: 1,
  //   waitingClientCount: 0,
  // }

  await pool.end();

  pool.getPoolState();

  // {
  //   activeConnectionCount: 0,
  //   ended: true,
  //   idleConnectionCount: 0,
  //   waitingClientCount: 0,
  // }
};

main();
```

Note: `pool.end()` does not terminate active connections/ transactions.

<a name="user-content-slonik-usage-api"></a>
<a name="slonik-usage-api"></a>
### API

```ts
/**
 * @param connectionUri PostgreSQL [Connection URI](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING).
 */
createPool(
  connectionUri: string,
  clientConfiguration: ClientConfiguration
): DatabasePool;

/**
 * @property captureStackTrace Dictates whether to capture stack trace before executing query. Middlewares access stack trace through query execution context. (Default: false)
 * @property connectionRetryLimit Number of times to retry establishing a new connection. (Default: 3)
 * @property connectionTimeout Timeout (in milliseconds) after which an error is raised if connection cannot be established. (Default: 5000)
 * @property idleInTransactionSessionTimeout Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000)
 * @property idleTimeout Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 5000)
 * @property interceptors An array of [Slonik interceptors](https://github.com/gajus/slonik#slonik-interceptors).
 * @property maximumPoolSize Do not allow more than this many connections. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 10)
 * @property PgPool Override the underlying PostgreSQL Pool constructor.
 * @property queryRetryLimit Number of times a query failing with Transaction Rollback class error, that doesn't belong to a transaction, is retried. (Default: 5)
 * @property ssl [tls.connect options](https://nodejs.org/api/tls.html#tlsconnectoptions-callback)
 * @property statementTimeout Timeout (in milliseconds) after which database is instructed to abort the query. Use 'DISABLE_TIMEOUT' constant to disable the timeout. (Default: 60000)
 * @property transactionRetryLimit Number of times a transaction failing with Transaction Rollback class error is retried. (Default: 5)
 * @property typeParsers An array of [Slonik type parsers](https://github.com/gajus/slonik#slonik-type-parsers).
 */
type ClientConfiguration = {
  captureStackTrace?: boolean,
  connectionRetryLimit?: number,
  connectionTimeout?: number | 'DISABLE_TIMEOUT',
  idleInTransactionSessionTimeout?: number | 'DISABLE_TIMEOUT',
  idleTimeout?: number | 'DISABLE_TIMEOUT',
  interceptors?: Interceptor[],
  maximumPoolSize?: number,
  PgPool?: new (poolConfig: PoolConfig) => PgPool,
  queryRetryLimit?: number,
  ssl?: Parameters<tls.connect>[0],
  statementTimeout?: number | 'DISABLE_TIMEOUT',
  transactionRetryLimit?: number,
  typeParsers?: TypeParser[],
};
```

Example:

```ts
import {
  createPool
} from 'slonik';

const pool = await createPool('postgres://');

await pool.query(sql.typeAlias('id')`SELECT 1 AS id`);
```

<a name="user-content-slonik-usage-default-configuration"></a>
<a name="slonik-usage-default-configuration"></a>
### Default configuration

<a name="user-content-slonik-usage-default-configuration-default-interceptors"></a>
<a name="slonik-usage-default-configuration-default-interceptors"></a>
#### Default interceptors

None.

Check out [`slonik-interceptor-preset`](https://github.com/gajus/slonik-interceptor-preset) for an opinionated collection of interceptors.

<a name="user-content-slonik-usage-default-configuration-default-type-parsers"></a>
<a name="slonik-usage-default-configuration-default-type-parsers"></a>
#### Default type parsers

These type parsers are enabled by default:

|Type name|Implementation|
|---|---|
|`date`|Produces a literal date as a string (format: YYYY-MM-DD).|
|`int8`|Produces an integer.|
|`interval`|Produces interval in seconds (integer).|
|`numeric`|Produces a float.|
|`timestamp`|Produces a unix timestamp (in milliseconds).|
|`timestamptz`|Produces a unix timestamp (in milliseconds).|

To disable the default type parsers, pass an empty array, e.g.

```ts
createPool('postgres://', {
  typeParsers: []
});
```

You can create default type parser collection using `createTypeParserPreset`, e.g.

```ts
import {
  createTypeParserPreset
} from 'slonik';

createPool('postgres://', {
  typeParsers: [
    ...createTypeParserPreset()
  ]
});
```

<a name="user-content-slonik-usage-default-configuration-default-timeouts"></a>
<a name="slonik-usage-default-configuration-default-timeouts"></a>
#### Default timeouts

There are 4 types of configurable timeouts:

|Configuration|Description|Default|
|---|---|---|
|`connectionTimeout`|Timeout (in milliseconds) after which an error is raised if connection cannot be established.|5000|
|`idleInTransactionSessionTimeout`|Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout.|60000|
|`idleTimeout`|Timeout (in milliseconds) after which idle clients are closed. Use 'DISABLE_TIMEOUT' constant to disable the timeout.|5000|
|`statementTimeout`|Timeout (in milliseconds) after which database is instructed to abort the query. Use 'DISABLE_TIMEOUT' constant to disable the timeout.|60000|

Slonik sets aggressive timeouts by default. These timeouts are designed to provide safe interface to the database. These timeouts might not work for all programs. If your program has long running statements, consider adjusting timeouts just for those statements instead of changing the defaults.

<a name="user-content-slonik-usage-default-configuration-known-limitations-of-using-pg-native-with-slonik"></a>
<a name="slonik-usage-default-configuration-known-limitations-of-using-pg-native-with-slonik"></a>
#### Known limitations of using pg-native with Slonik

* notice logs are not captured in `notices` query result property (`notice` event is never fired on connection instance).
* cannot combine multiple commands into a single statement (pg-native limitation [#88](https://github.com/brianc/node-pg-native/issues/88))
* does not support streams.

<a name="user-content-slonik-usage-checking-out-a-client-from-the-connection-pool"></a>
<a name="slonik-usage-checking-out-a-client-from-the-connection-pool"></a>
### Checking out a client from the connection pool

Slonik only allows to check out a connection for the duration of the promise routine supplied to the `pool#connect()` method.

```ts
import {
  createPool,
} from 'slonik';

const pool = await createPool('postgres://localhost');

const result = await pool.connect(async (connection) => {
  await connection.query(sql.typeAlias('id')`SELECT 1 AS id`);
  await connection.query(sql.typeAlias('id')`SELECT 2 AS id`);

  return 'foo';
});

result;
// 'foo'

```

Connection is released back to the pool after the promise produced by the function supplied to `connect()` method is either resolved or rejected.

Read: [Protecting against unsafe connection handling](#user-content-protecting-against-unsafe-connection-handling)

<a name="user-content-slonik-usage-mocking-slonik"></a>
<a name="slonik-usage-mocking-slonik"></a>
### Mocking Slonik

Slonik provides a way to mock queries against the database.

* Use `createMockPool` to create a mock connection.
* Use `createMockQueryResult` to create a mock query result.

```ts
import {
  createMockPool,
  createMockQueryResult,
} from 'slonik';

type OverridesType =
  query: (sql: string, values: PrimitiveValueExpression[],) => Promise<QueryResult<QueryResultRow>>,
};

createMockPool(overrides: OverridesType): DatabasePool;
createMockQueryResult(rows: QueryResultRow[]): QueryResult<QueryResultRow>;
```

Example:

```ts
import {
  createMockPool,
  createMockQueryResult,
} from 'slonik';

const pool = createMockPool({
  query: async () => {
    return createMockQueryResult([
      {
        foo: 'bar',
      },
    ]);
  },
});

await pool.connect(async (connection) => {
  const results = await connection.query(sql.typeAlias('foo')`
    SELECT ${'foo'} AS foo
  `);
});
```


<a name="user-content-slonik-how-are-they-different"></a>
<a name="slonik-how-are-they-different"></a>
## How are they different?

<a name="user-content-slonik-how-are-they-different-pg-vs-slonik"></a>
<a name="slonik-how-are-they-different-pg-vs-slonik"></a>
### <code>pg</code> vs <code>slonik</code>

[`pg`](https://github.com/brianc/node-postgres) is built intentionally to provide unopinionated, minimal abstraction and encourages use of other modules to implement convenience methods.

Slonik is built on top of `pg` and it provides convenience methods for [building queries](#user-content-value-placeholders) and [querying data](#user-content-slonik-query-methods).

Work on `pg` began on [Tue Sep 28 22:09:21 2010](https://github.com/brianc/node-postgres/commit/cf637b08b79ef93d9a8b9dd2d25858aa7e9f9bdc). It is authored by [Brian Carlson](https://github.com/brianc).

<a name="user-content-slonik-how-are-they-different-pg-promise-vs-slonik"></a>
<a name="slonik-how-are-they-different-pg-promise-vs-slonik"></a>
### <code>pg-promise</code> vs <code>slonik</code>

As the name suggests, [`pg-promise`](https://github.com/vitaly-t/pg-promise) was originally built to enable use of `pg` module with promises (at the time, `pg` only supported Continuation Passing Style (CPS), i.e. callbacks). Since then `pg-promise` added features for connection/ transaction handling, a powerful query-formatting engine and a declarative approach to handling query results.

The primary difference between Slonik and `pg-promise`:

* Slonik does not allow to execute raw text queries. Slonik queries can only be constructed using [`sql` tagged template literals](#user-content-slonik-value-placeholders-tagged-template-literals). This design [protects against unsafe value interpolation](#user-content-protecting-against-unsafe-value-interpolation).
* Slonik implements [interceptor API](#user-content-slonik-interceptors) (middleware). Middlewares allow to modify connection handling, override queries and modify the query results. Example Slonik interceptors include [field name transformation](https://github.com/gajus/slonik-interceptor-field-name-transformation), [query normalization](https://github.com/gajus/slonik-interceptor-query-normalisation) and [query benchmarking](https://github.com/gajus/slonik-interceptor-query-benchmarking).

Note: Author of `pg-promise` has [objected to the above claims](https://github.com/gajus/slonik/issues/122). I have removed a difference that was clearly wrong. I maintain that the above two differences remain valid differences: even though `pg-promise` might have substitute functionality for variable interpolation and interceptors, it implements them in a way that does not provide the same benefits that Slonik provides, namely: guaranteed security and support for extending library functionality using multiple plugins.

Other differences are primarily in how the equivalent features are implemented, e.g.

|`pg-promise`|Slonik|
|---|---|
|[Custom type formatting](https://github.com/vitaly-t/pg-promise#custom-type-formatting).|Not available in Slonik. The current proposal is to create an interceptor that would have access to the [query fragment constructor](https://github.com/gajus/slonik/issues/21).|
|[formatting filters](https://github.com/vitaly-t/pg-promise#nested-named-parameters)|Slonik tagged template [value expressions](https://github.com/gajus/slonik#slonik-value-placeholders) to construct query fragments and bind parameter values.|
|[Query files](https://github.com/vitaly-t/pg-promise#query-files).|Use [`slonik-sql-tag-raw`](https://github.com/gajus/slonik-sql-tag-raw).|
|[Tasks](https://github.com/vitaly-t/pg-promise#tasks).|Use [`pool.connect`](https://github.com/gajus/slonik#slonik-usage-create-connection).|
|Configurable transactions.|Not available in Slonik. Track [this issue](https://github.com/gajus/slonik/issues/30).|
|Events.|Use [interceptors](https://github.com/gajus/slonik#slonik-interceptors).|

When weighting which abstraction to use, it would be unfair not to consider that `pg-promise` is a mature project with dozens of contributors. Meanwhile, Slonik is a young project (started in March 2017) that until recently was developed without active community input. However, if you do support the unique features that Slonik adds, the opinionated API design, and are not afraid of adopting a technology in its young days, then I warmly invite you to adopt Slonik and become a contributor to what I intend to make the standard PostgreSQL client in the Node.js community.

Work on `pg-promise` began [Wed Mar 4 02:00:34 2015](https://github.com/vitaly-t/pg-promise/commit/78fb80f638e7f28b301f75576701536d6b638f31). It is authored by [Vitaly Tomilov](https://github.com/vitaly-t).

<a name="user-content-slonik-how-are-they-different-postgres-vs-slonik"></a>
<a name="slonik-how-are-they-different-postgres-vs-slonik"></a>
### <code>postgres</code> vs <code>slonik</code>

[`postgres`](https://github.com/porsager/postgres) recently gained in popularity due to its performance benefits when compared to `pg`. In terms of API, it has a pretty bare-bones API that heavily relies on using ES6 tagged templates and abstracts away many concepts of connection pool handling. While `postgres` API might be preferred by some, projects that already use `pg` may have difficulty migrating.

However, by using [postgres-bridge](https://github.com/gajus/postgres-bridge) (`postgres`/`pg` compatibility layer), you can benefit from `postgres` performance improvements while still using Slonik API:

```ts
import postgres from 'postgres';
import { createPostgresBridge } from 'postgres-bridge';
import { createPool } from 'slonik';
const PostgresBridge = createPostgresBridge(postgres);
const pool = createPool('postgres://', {
  PgPool: PostgresBridge,
});
```

<a name="user-content-slonik-type-parsers"></a>
<a name="slonik-type-parsers"></a>
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

Type parsers are configured using [`typeParsers` client configuration](#user-content-slonik-usage-api).

Read: [Default type parsers](#user-content-default-type-parsers).

<a name="user-content-slonik-type-parsers-built-in-type-parsers"></a>
<a name="slonik-type-parsers-built-in-type-parsers"></a>
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


<a name="user-content-slonik-interceptors"></a>
<a name="slonik-interceptors"></a>
## Interceptors

Functionality can be added to Slonik client by adding interceptors (middleware).

Interceptors are configured using [client configuration](#user-content-api), e.g.

```ts
import {
  createPool
} from 'slonik';

const interceptors = [];

const connection = await createPool('postgres://', {
  interceptors
});
```

Interceptors are executed in the order they are added.

Read: [Default interceptors](#user-content-default-interceptors).

<a name="user-content-slonik-interceptors-interceptor-methods"></a>
<a name="slonik-interceptors-interceptor-methods"></a>
### Interceptor methods

Interceptor is an object that implements methods that can change the behaviour of the database client at different stages of the connection life-cycle

```ts
type Interceptor = {
  afterPoolConnection?: (
    connectionContext: ConnectionContext,
    connection: DatabasePoolConnection
  ) => MaybePromise<null>,
  afterQueryExecution?: (
    queryContext: QueryContext,
    query: Query,
    result: QueryResult<QueryResultRow>
  ) => MaybePromise<QueryResult<QueryResultRow>>,
  beforePoolConnection?: (
    connectionContext: ConnectionContext
  ) => MaybePromise<?DatabasePool>,
  beforePoolConnectionRelease?: (
    connectionContext: ConnectionContext,
    connection: DatabasePoolConnection
  ) => MaybePromise<null>,
  beforeQueryExecution?: (
    queryContext: QueryContext,
    query: Query
  ) => MaybePromise<QueryResult<QueryResultRow>> | MaybePromise<null>,
  beforeQueryResult?: (
    queryContext: QueryContext,
    query: Query,
    result: QueryResult<QueryResultRow>
  ) => MaybePromise<null>,
  beforeTransformQuery?: (
    queryContext: QueryContext,
    query: Query
  ) => Promise<null>,
  queryExecutionError?: (
    queryContext: QueryContext,
    query: Query,
    error: SlonikError
  ) => MaybePromise<null>,
  transformQuery?: (
    queryContext: QueryContext,
    query: Query
  ) => Query,
  transformRow?: (
    queryContext: QueryContext,
    query: Query,
    row: QueryResultRow,
    fields: Field[],
  ) => QueryResultRow
};
```

<a name="user-content-slonik-interceptors-interceptor-methods-afterpoolconnection"></a>
<a name="slonik-interceptors-interceptor-methods-afterpoolconnection"></a>
#### <code>afterPoolConnection</code>

Executed after a connection is acquired from the connection pool (or a new connection is created), e.g.

```ts
const pool = await createPool('postgres://');

// Interceptor is executed here. ↓
pool.connect();
```

<a name="user-content-slonik-interceptors-interceptor-methods-afterqueryexecution"></a>
<a name="slonik-interceptors-interceptor-methods-afterqueryexecution"></a>
#### <code>afterQueryExecution</code>

Executed after query has been executed and before rows were transformed using `transformRow`.

Note: When query is executed using `stream`, then `afterQuery` is called with empty result set.

<a name="user-content-slonik-interceptors-interceptor-methods-beforequeryexecution"></a>
<a name="slonik-interceptors-interceptor-methods-beforequeryexecution"></a>
#### <code>beforeQueryExecution</code>

This function can optionally return a direct result of the query which will cause the actual query never to be executed.

<a name="user-content-slonik-interceptors-interceptor-methods-beforequeryresult"></a>
<a name="slonik-interceptors-interceptor-methods-beforequeryresult"></a>
#### <code>beforeQueryResult</code>

Executed just before the result is returned to the client.

Use this method to capture the result that will be returned to the client.

<a name="user-content-slonik-interceptors-interceptor-methods-beforetransformquery"></a>
<a name="slonik-interceptors-interceptor-methods-beforetransformquery"></a>
#### <code>beforeTransformQuery</code>

Executed before `transformQuery`. Use this interceptor to capture the original query (e.g. for logging purposes).

<a name="user-content-slonik-interceptors-interceptor-methods-beforepoolconnection"></a>
<a name="slonik-interceptors-interceptor-methods-beforepoolconnection"></a>
#### <code>beforePoolConnection</code>

Executed before connection is created.

This function can optionally return a pool to another database, causing a connection to be made to the new pool.

<a name="user-content-slonik-interceptors-interceptor-methods-beforepoolconnectionrelease"></a>
<a name="slonik-interceptors-interceptor-methods-beforepoolconnectionrelease"></a>
#### <code>beforePoolConnectionRelease</code>

Executed before connection is released back to the connection pool, e.g.

```ts
const pool = await createPool('postgres://');

pool.connect(async () => {
  await 1;

  // Interceptor is executed here. ↓
});
```

<a name="user-content-slonik-interceptors-interceptor-methods-queryexecutionerror"></a>
<a name="slonik-interceptors-interceptor-methods-queryexecutionerror"></a>
#### <code>queryExecutionError</code>

Executed if query execution produces an error.

Use `queryExecutionError` to log and/ or re-throw another error.

<a name="user-content-slonik-interceptors-interceptor-methods-transformquery"></a>
<a name="slonik-interceptors-interceptor-methods-transformquery"></a>
#### <code>transformQuery</code>

Executed before `beforeQueryExecution`.

Transforms query.

<a name="user-content-slonik-interceptors-interceptor-methods-transformrow"></a>
<a name="slonik-interceptors-interceptor-methods-transformrow"></a>
#### <code>transformRow</code>

Executed for each row.

Transforms row.

Use `transformRow` to modify the query result.

<a name="user-content-slonik-interceptors-community-interceptors"></a>
<a name="slonik-interceptors-community-interceptors"></a>
### Community interceptors

|Name|Description|
|---|---|
|[`slonik-interceptor-field-name-transformation`](https://github.com/gajus/slonik-interceptor-field-name-transformation)|Transforms Slonik query result field names.|
|[`slonik-interceptor-query-benchmarking`](https://github.com/gajus/slonik-interceptor-query-benchmarking)|Benchmarks Slonik queries.|
|[`slonik-interceptor-query-cache`](https://github.com/gajus/slonik-interceptor-query-cache)|Caches Slonik queries.|
|[`slonik-interceptor-query-logging`](https://github.com/gajus/slonik-interceptor-query-logging)|Logs Slonik queries.|
|[`slonik-interceptor-query-normalisation`](https://github.com/gajus/slonik-interceptor-query-normalisation)|Normalises Slonik queries.|

Check out [`slonik-interceptor-preset`](https://github.com/gajus/slonik-interceptor-preset) for an opinionated collection of interceptors.


<a name="user-content-slonik-recipes"></a>
<a name="slonik-recipes"></a>
## Recipes

<a name="user-content-slonik-recipes-inserting-large-number-of-rows"></a>
<a name="slonik-recipes-inserting-large-number-of-rows"></a>
### Inserting large number of rows

Use [`sql.unnest`](#user-content-sqlunnest) to create a set of rows using `unnest`. Using the `unnest` approach requires only 1 variable per every column; values for each column are passed as an array, e.g.

```ts
await connection.query(sql.unsafe`
  INSERT INTO foo (bar, baz, qux)
  SELECT *
  FROM ${sql.unnest(
    [
      [1, 2, 3],
      [4, 5, 6]
    ],
    [
      'int4',
      'int4',
      'int4'
    ]
  )}
`);
```

Produces:

```ts
{
  sql: 'INSERT INTO foo (bar, baz, qux) SELECT * FROM unnest($1::int4[], $2::int4[], $3::int4[])',
  values: [
    [
      1,
      4
    ],
    [
      2,
      5
    ],
    [
      3,
      6
    ]
  ]
}
```

Inserting data this way ensures that the query is stable and reduces the amount of time it takes to parse the query.

<a name="user-content-slonik-recipes-routing-queries-to-different-connections"></a>
<a name="slonik-recipes-routing-queries-to-different-connections"></a>
### Routing queries to different connections

A typical load balancing requirement is to route all "logical" read-only queries to a read-only instance. This requirement can be implemented in 2 ways:

1. Create two instances of Slonik (read-write and read-only) and pass them around the application as needed.
1. Use `beforePoolConnection` middleware to assign query to a connection pool based on the query itself.

First option is preferable as it is the most explicit. However, it also has the most overhead to implement.

On the other hand, `beforePoolConnection` makes it easy to route based on conventions, but carries a greater risk of accidentally routing queries with side-effects to a read-only instance.

The first option is self-explanatory to implement, but this recipe demonstrates my convention for using `beforePoolConnection` to route queries.

Note: How you determine which queries are safe to route to a read-only instance is outside of scope for this documentation.

Note: `beforePoolConnection` only works for connections initiated by a query, i.e. `pool#query` and not `pool#connect()`.

Note: `pool#transaction` triggers `beforePoolConnection` but has no `query`.

Note: This particular implementation does not handle [`SELECT INTO`](https://www.postgresql.org/docs/current/sql-selectinto.html).

```ts
const readOnlyPool = await createPool('postgres://read-only');
const pool = await createPool('postgres://main', {
  interceptors: [
    {
      beforePoolConnection: (connectionContext) => {
        if (!connectionContext.query?.sql.trim().startsWith('SELECT ')) {
          // Returning null falls back to using the DatabasePool from which the query originates.
          return null;
        }

        // This is a convention for the edge-cases where a SELECT query includes a volatile function.
        // Adding a @volatile comment anywhere into the query bypasses the read-only route, e.g.
        // sql.unsafe`
        //   # @volatile
        //   SELECT write_log()
        // `
        if (connectionContext.query?.sql.includes('@volatile')) {
          return null;
        }

        // Returning an instance of DatabasePool will attempt to run the query using the other connection pool.
        // Note that all other interceptors of the pool that the query originated from are short-circuited.
        return readOnlyPool;
      }
    }
  ]
});

// This query will use `postgres://read-only` connection.
pool.query(sql.typeAlias('id')`SELECT 1 AS id`);

// This query will use `postgres://main` connection.
pool.query(sql.typeAlias('id')`UPDATE 1 AS id`);
```

<a name="user-content-slonik-recipes-building-utility-statements"></a>
<a name="slonik-recipes-building-utility-statements"></a>
### Building Utility Statements

Parameter symbols only work in optimizable SQL commands (SELECT, INSERT, UPDATE, DELETE, and certain commands containing one of these). In other statement types (generically called utility statements, e.g. ALTER, CREATE, DROP and SET), you must insert values textually even if they are just data values.

In the context of Slonik, if you are building utility statements you must use query building methods that interpolate values directly into queries:

* [`sql.identifier`](#user-content-slonik-query-building-sql-identifier) – for identifiers.
* [`sql.literalValue`](#user-content-slonik-query-building-sql-literalvalue) – for values.

Example:

```ts
await connection.query(sql.typeAlias('void')`
  CREATE USER ${sql.identifier(['foo'])}
  WITH PASSWORD ${sql.literalValue('bar')}
`);
```


<a name="user-content-slonik-runtime-validation"></a>
<a name="slonik-runtime-validation"></a>
## Runtime validation

Slonik integrates [zod](https://github.com/colinhacks/zod) to provide runtime query result validation and static type inference.

Validating queries requires to:

1. Define a Zod [object](https://github.com/colinhacks/zod#objects) and passing it to `sql.type` tagged template (see below)
1. Add a [result parser interceptor](#user-content-result-parser-interceptor)

<a name="user-content-slonik-runtime-validation-motivation"></a>
<a name="slonik-runtime-validation-motivation"></a>
### Motivation

Build-time type safety guarantees that your application will work as expected at the time of the build (assuming that the types are correct in the first place).

The problem is that once you deploy the application, the database schema might change independently of the codebase. This drift may result in your application behaving in unpredictable and potentially dangerous ways, e.g., imagine if table `product` changed `price` from `numeric` to `text`. Without runtime validation, this would cause a cascade of problems and potential database corruption. Even worse, without runtime checks, this could go unnoticed for a long time.

In contrast, by using runtime checks, you can ensure that the contract between your codebase and the database is always respected. If there is a breaking change, the application fails with a loud error that is easy to debug.

By using `zod`, we get the best of both worlds: type safety and runtime checks.

<a name="user-content-slonik-runtime-validation-example-use-of-sql-type"></a>
<a name="slonik-runtime-validation-example-use-of-sql-type"></a>
### Example use of <code>sql.type</code>

Let's assume that you have a PostgreSQL table `person`:

```sql
CREATE TABLE "public"."person" (
  "id" integer GENERATED ALWAYS AS IDENTITY,
  "name" text NOT NULL,
  PRIMARY KEY ("id")
);
```

and you want to retrieve all persons in the database, along with their `id` and `name`:

```ts
connection.any(sql.unsafe`
  SELECT id, name
  FROM person
`);
```

With your knowledge of the database schema, define a zod object:

```ts
const personObject = z.object({
  id: z.number(),
  name: z.string(),
});
```

Update your query to use `sql.type` tag and pass `personObject`:

```ts
const personQuery = sql.type(personObject)`
  SELECT id, name
  FROM person
`;
```

Finally, query the database using typed `sql` tagged template:

```ts
const persons = await connection.any(personQuery);
```

With this information, Slonik guarantees that every member of `persons` is an object that has properties `id` and `name`, which are a non-null `number` and a non-null `string` respectively.

<a name="user-content-slonik-runtime-validation-performance-penalty"></a>
<a name="slonik-runtime-validation-performance-penalty"></a>
### Performance penalty

In the context of the network overhead, validation accounts for a tiny amount of the total execution time.

Just to give an idea, in our sample of data, it takes sub 0.1ms to validate 1 row, ~3ms to validate 1,000 and ~25ms to validate 100,000 rows.

<a name="user-content-slonik-runtime-validation-unknown-keys"></a>
<a name="slonik-runtime-validation-unknown-keys"></a>
### Unknown keys

Slonik disallows unknown keys, i.e. query that returns `{foo: 'bar', baz: 'qux'}` with `z.object({foo: z.string()})` schema will produce `SchemaValidationError` error.

<a name="user-content-slonik-runtime-validation-handling-schema-validation-errors"></a>
<a name="slonik-runtime-validation-handling-schema-validation-errors"></a>
### Handling schema validation errors

If query produces a row that does not satisfy zod object, then `SchemaValidationError` error is thrown.

`SchemaValidationError` includes properties that describe the query and validation errors:

* `sql` – SQL of the query that produced unexpected row.
* `row` – row data that did not satisfy the schema.
* `issues` – array of unmet expectations.

Whenever this error occurs, the same information is also included in the [logs](#user-content-logging).

In most cases, you shouldn't attempt to handle these errors at individual query level – allow to propagate to the top of the application and fix the issue when you become aware of it.

However, in cases such as dealing with unstructured data, it might be useful to handle these errors at a query level, e.g.

```ts
import {
  SchemaValidationError
} from 'slonik';
try {
} catch (error) {
  if (error extends SchemaValidationError) {
    // Handle scheme validation error
  }
}
```

<a name="user-content-slonik-runtime-validation-inferring-types"></a>
<a name="slonik-runtime-validation-inferring-types"></a>
### Inferring types

You can infer the TypeScript type of the query result. There are couple of ways of doing it:

```ts
// Infer using z.infer<typeof yourSchema>
// https://github.com/colinhacks/zod#type-inference
type Person = z.infer<typeof personObject>;
// from sql tagged template `parser` property
type Person = z.infer<
  personQuery.parser
>;
```

<a name="user-content-slonik-runtime-validation-transforming-results"></a>
<a name="slonik-runtime-validation-transforming-results"></a>
### Transforming results

Using zod [transform](https://github.com/colinhacks/zod#transform) you can refine the result shape and its type, e.g.

```ts
const coordinatesType = z.string().transform((subject) => {
  const [
    x,
    y,
  ] = subject.split(',');

  return {
    x: Number(x),
    y: Number(y),
  };
});

const zodObject = z.object({
  foo: coordinatesType,
});

const query = sql.type(zodObject)`SELECT '1,2' as foo`;

const result = await pool.one(query);

expectTypeOf(result).toMatchTypeOf<{foo: {x: number, y: number, }, }>();

t.deepEqual(result, {
  foo: {
    x: 1,
    y: 2,
  },
});
```

<a name="user-content-slonik-runtime-validation-result-parser-interceptor"></a>
<a name="slonik-runtime-validation-result-parser-interceptor"></a>
### Result parser interceptor

Slonik works without the interceptor, but it doesn't validate the query results. To validate results, you must implement an interceptor that parses the results.

For context, when Zod parsing was first introduced to Slonik, it was enabled for all queries by default. However, I eventually realized that the baked-in implementation is not going to suit everyone's needs. For this reason, I decided to take out the built-in interceptor in favor of providing examples for common use cases. What follows is the original default implementation.

```ts
import {
  type Interceptor,
  type QueryResultRow,
  SchemaValidationError,
} from 'slonik';

const createResultParserInterceptor = (): Interceptor => {
  return {
    // If you are not going to transform results using Zod, then you should use `afterQueryExecution` instead.
    // Future versions of Zod will provide a more efficient parser when parsing without transformations.
    // You can even combine the two – use `afterQueryExecution` to validate results, and (conditionally)
    // transform results as needed in `transformRow`.
    transformRow: (executionContext, actualQuery, row) => {
      const {
        log,
        resultParser,
      } = executionContext;

      if (!resultParser) {
        return row;
      }

      const validationResult = resultParser.safeParse(row);

      if (!validationResult.success) {
        throw new SchemaValidationError(
          actualQuery,
          row,
          validationResult.error.issues,
        );
      }

      return validationResult.data as QueryResultRow;
    },
  };
};
```

To use it, simply add it as a middleware:

```ts
import {
  createPool,
} from 'slonik';

createPool('postgresql://', {
  interceptors: [
    createResultParserInterceptor(),
  ]
});
```

<a name="user-content-slonik-sql-tag"></a>
<a name="slonik-sql-tag"></a>
## <code>sql</code> tag

`sql` tag serves two purposes:

* It is used to construct queries with bound parameter values (see [Value placeholders](#user-content-value-placeholders)).
* It used to generate dynamic query fragments (see [Query building](#user-content-query-building)).

`sql` tag can be imported from Slonik package:

```ts
import {
  sql
} from 'slonik';
```

Sometimes it may be desirable to construct a custom instance of `sql` tag. In those cases, you can use the `createSqlTag` factory, e.g.

```ts
import {
  createSqlTag
} from 'slonik';

const sql = createSqlTag();
```

<a name="user-content-slonik-sql-tag-type-aliases"></a>
<a name="slonik-sql-tag-type-aliases"></a>
### Type aliases

You can create a `sql` tag with a predefined set of Zod type aliases that can be later referenced when creating a query with [runtime validation](#user-content-runtime-validation).

Slonik documentation assumes that these type aliases are defined:

```ts
const sql = createSqlTag({
  typeAliases: {
    // `foo` is a documentation specific example
    foo: z.object({
      foo: z.string(),
    }),
    id: z.object({
      id: z.number(),
    }),
    void: z.object({}).strict(),
  }
})
```

These are documentation specific examples that you are not expected to blindly copy. However, `id` and `void` are recommended aliases as they reflect common patterns, e.g.

```ts
const personId = await pool.oneFirst(
  sql.typeAlias('id')`
    SELECT id
    FROM person
  `
);

await pool.query(sql.typeAlias('void')`
  INSERT INTO person_view (person_id)
  VALUES (${personId})
`);
```

<a name="user-content-slonik-sql-tag-typing-sql-tag"></a>
<a name="slonik-sql-tag-typing-sql-tag"></a>
### Typing <code>sql</code> tag

See [runtime validation](#user-content-runtime-validation).

<a name="user-content-slonik-value-placeholders"></a>
<a name="slonik-value-placeholders"></a>
## Value placeholders

<a name="user-content-slonik-value-placeholders-tagged-template-literals"></a>
<a name="slonik-value-placeholders-tagged-template-literals"></a>
### Tagged template literals

Slonik query methods can only be executed using `sql` [tagged template literal](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals), e.g.

```ts
import {
  sql
} from 'slonik'

connection.query(sql.typeAlias('id')`
  SELECT 1 AS id
  FROM foo
  WHERE bar = ${'baz'}
`);
```

The above is equivalent to evaluating:

```sql
SELECT 1 AS id
FROM foo
WHERE bar = $1

```

query with 'baz' value binding.

<a name="user-content-slonik-value-placeholders-manually-constructing-the-query"></a>
<a name="slonik-value-placeholders-manually-constructing-the-query"></a>
### Manually constructing the query

Manually constructing queries is not allowed.

There is an internal mechanism that checks to see if query was created using `sql` tagged template literal, i.e.

```ts
const query = {
  sql: 'SELECT 1 AS id FROM foo WHERE bar = $1',
  type: 'SQL',
  values: [
    'baz'
  ]
};

connection.query(query);
```

Will result in an error:

> Query must be constructed using `sql` tagged template literal.

This is a security measure designed to prevent unsafe query execution.

Furthermore, a query object constructed using `sql` tagged template literal is [frozen](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) to prevent further manipulation.

<a name="user-content-slonik-value-placeholders-nesting-sql"></a>
<a name="slonik-value-placeholders-nesting-sql"></a>
### Nesting <code>sql</code>

`sql` tagged template literals can be nested, e.g.

```ts
const query0 = sql.unsafe`SELECT ${'foo'} FROM bar`;
const query1 = sql.unsafe`SELECT ${'baz'} FROM (${query0})`;
```

Produces:

```ts
{
  sql: 'SELECT $1 FROM (SELECT $2 FROM bar)',
  values: [
    'baz',
    'foo'
  ]
}
```


<a name="user-content-slonik-query-building"></a>
<a name="slonik-query-building"></a>
## Query building

Queries are built using methods of the `sql` tagged template literal.

If this is your first time using Slonik, read [Dynamically generating SQL queries using Node.js](https://dev.to/gajus/dynamically-generating-sql-queries-using-node-js-2c1g).

<a name="user-content-slonik-query-building-sql-array"></a>
<a name="slonik-query-building-sql-array"></a>
### <code>sql.array</code>

```ts
(
  values: readonly PrimitiveValueExpression[],
  memberType: SqlFragment | TypeNameIdentifier,
) => ArraySqlToken,
```

Creates an array value binding, e.g.

```ts
await connection.query(sql.typeAlias('id')`
  SELECT (${sql.array([1, 2, 3], 'int4')}) AS id
`);
```

Produces:

```ts
{
  sql: 'SELECT $1::"int4"[]',
  values: [
    [
      1,
      2,
      3
    ]
  ]
}
```

<a name="user-content-slonik-query-building-sql-array-sql-array-membertype"></a>
<a name="slonik-query-building-sql-array-sql-array-membertype"></a>
#### <code>sql.array</code> <code>memberType</code>

If `memberType` is a string (`TypeNameIdentifier`), then it is treated as a type name identifier and will be quoted using double quotes, i.e. `sql.array([1, 2, 3], 'int4')` is equivalent to `$1::"int4"[]`. The implication is that keywords that are often used interchangeably with type names are not going to work, e.g. [`int4`](https://github.com/postgres/postgres/blob/69edf4f8802247209e77f69e089799b3d83c13a4/src/include/catalog/pg_type.dat#L74-L78) is a type name identifier and will work. However, [`int`](https://github.com/postgres/postgres/blob/69edf4f8802247209e77f69e089799b3d83c13a4/src/include/parser/kwlist.h#L213) is a keyword and will not work. You can either use type name identifiers or you can construct custom member using `sql.fragment` tag, e.g.

```ts
await connection.query(sql.typeAlias('id')`
  SELECT (${sql.array([1, 2, 3], sql.fragment`int[]`)}) AS id
`);
```

Produces:

```ts
{
  sql: 'SELECT $1::int[]',
  values: [
    [
      1,
      2,
      3
    ]
  ]
}
```

<a name="user-content-slonik-query-building-sql-array-sql-array-vs-sql-join"></a>
<a name="slonik-query-building-sql-array-sql-array-vs-sql-join"></a>
#### <code>sql.array</code> vs <code>sql.join</code>

Unlike `sql.join`, `sql.array` generates a stable query of a predictable length, i.e. regardless of the number of values in the array, the generated query remains the same:

* Having a stable query enables [`pg_stat_statements`](https://www.postgresql.org/docs/current/pgstatstatements.html) to aggregate all query execution statistics.
* Keeping the query length short reduces query parsing time.

Example:

```ts
sql.typeAlias('id')`
  SELECT id
  FROM foo
  WHERE id IN (${sql.join([1, 2, 3], sql.fragment`, `)})
`;
sql.typeAlias('id')`
  SELECT id
  FROM foo
  WHERE id NOT IN (${sql.join([1, 2, 3], sql.fragment`, `)})
`;
```

Is equivalent to:

```ts
sql.typeAlias('id')`
  SELECT id
  FROM foo
  WHERE id = ANY(${sql.array([1, 2, 3], 'int4')})
`;
sql.typeAlias('id')`
  SELECT id
  FROM foo
  WHERE id != ALL(${sql.array([1, 2, 3], 'int4')})
`;
```

Furthermore, unlike `sql.join`, `sql.array` can be used with an empty array of values. In short, `sql.array` should be preferred over `sql.join` when possible.

<a name="user-content-slonik-query-building-sql-binary"></a>
<a name="slonik-query-building-sql-binary"></a>
### <code>sql.binary</code>

```ts
(
  data: Buffer
) => BinarySqlToken;
```

Binds binary ([`bytea`](https://www.postgresql.org/docs/current/datatype-binary.html)) data, e.g.

```ts
await connection.query(sql.unsafe`
  SELECT ${sql.binary(Buffer.from('foo'))}
`);
```

Produces:

```ts
{
  sql: 'SELECT $1',
  values: [
    Buffer.from('foo')
  ]
}
```

<a name="user-content-slonik-query-building-sql-date"></a>
<a name="slonik-query-building-sql-date"></a>
### <code>sql.date</code>

```ts
(
  date: Date
) => DateSqlToken;
```

Inserts a date, e.g.

```ts
await connection.query(sql.unsafe`
  SELECT ${sql.date(new Date('2022-08-19T03:27:24.951Z'))}
`);
```

Produces:

```ts
{
  sql: 'SELECT $1::date',
  values: [
    '2022-08-19'
  ]
}
```

<a name="user-content-slonik-query-building-sql-fragment"></a>
<a name="slonik-query-building-sql-fragment"></a>
### <code>sql.fragment</code>

```ts
(
  template: TemplateStringsArray,
  ...values: ValueExpression[]
) => SqlFragment;
```

A SQL fragment, e.g.

```ts
sql.fragment`FOO`
```

Produces:

```ts
{
  sql: 'FOO',
  values: []
}
```

SQL fragments can be used to build more complex queries, e.g.

```ts
const whereFragment = sql.fragment`
  WHERE bar = 'baz';
`;

sql.typeAlias('id')`
  SELECT id
  FROM foo
  ${whereFragment}
`
```

The only difference between queries and fragments is that fragments are untyped and they cannot be used as inputs to query methods (use `sql.type` instead).

<a name="user-content-slonik-query-building-sql-identifier"></a>
<a name="slonik-query-building-sql-identifier"></a>
### <code>sql.identifier</code>

```ts
(
  names: string[],
) => IdentifierSqlToken;
```

[Delimited identifiers](https://www.postgresql.org/docs/current/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS) are created by enclosing an arbitrary sequence of characters in double-quotes ("). To create a delimited identifier, create an `sql` tag function placeholder value using `sql.identifier`, e.g.

```ts
sql.typeAlias('id')`
  SELECT 1 AS id
  FROM ${sql.identifier(['bar', 'baz'])}
`;
```

Produces:

```ts
{
  sql: 'SELECT 1 FROM "bar"."baz"',
  values: []
}
```

<a name="user-content-slonik-query-building-sql-interval"></a>
<a name="slonik-query-building-sql-interval"></a>
### <code>sql.interval</code>

```ts
(
  interval: {
    years?: number,
    months?: number,
    weeks?: number,
    days?: number,
    hours?: number,
    minutes?: number,
    seconds?: number,
  }
) => IntervalSqlToken;
```

Inserts an [interval](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-INTERVAL-INPUT), e.g.

```ts
sql.typeAlias('id')`
  SELECT 1 AS id
  FROM ${sql.interval({days: 3})}
`;
```

Produces:

```ts
{
  sql: 'SELECT make_interval("days" => $1)',
  values: [
    3
  ]
}
```

You can use `sql.interval` exactly how you would use PostgreSQL [`make_interval` function](https://www.postgresql.org/docs/current/functions-datetime.html). However, notice that Slonik does not use abbreviations, i.e. "secs" is seconds and "mins" is minutes.

|`make_interval`|`sql.interval`|Interval output|
|---|---|---|
|`make_interval("days" => 1, "hours" => 2)`|`sql.interval({days: 1, hours: 2})`|`1 day 02:00:00`|
|`make_interval("mins" => 1)`|`sql.interval({minutes: 1})`|`00:01:00`|
|`make_interval("secs" => 120)`|`sql.interval({seconds: 120})`|`00:02:00`|
|`make_interval("secs" => 0.001)`|`sql.interval({seconds: 0.001})`|`00:00:00.001`|

<a name="user-content-slonik-query-building-sql-interval-dynamic-intervals-without-sql-interval"></a>
<a name="slonik-query-building-sql-interval-dynamic-intervals-without-sql-interval"></a>
#### Dynamic intervals without <code>sql.interval</code>

If you need a dynamic interval (e.g. X days), you can achieve this using multiplication, e.g.

```ts
sql.unsafe`
  SELECT ${2} * interval '1 day'
`
```

The above is equivalent to `interval '2 days'`.

You could also use `make_interval()` directly, e.g.

```ts
sql.unsafe`
  SELECT make_interval("days" => ${2})
`
```

`sql.interval` was added mostly as a type-safe alternative.

<a name="user-content-slonik-query-building-sql-join"></a>
<a name="slonik-query-building-sql-join"></a>
### <code>sql.join</code>

```ts
(
  members: SqlSqlToken[],
  glue: SqlSqlToken
) => ListSqlToken;
```

Concatenates SQL expressions using `glue` separator, e.g.

```ts
await connection.query(sql.unsafe`
  SELECT ${sql.join([1, 2, 3], sql.fragment`, `)}
`);
```

Produces:

```ts
{
  sql: 'SELECT $1, $2, $3',
  values: [
    1,
    2,
    3
  ]
}
```

`sql.join` is the primary building block for most of the SQL, e.g.

Boolean expressions:

```ts
sql.unsafe`
  SELECT ${sql.join([1, 2], sql.fragment` AND `)}
`

// SELECT $1 AND $2
```

Tuple:

```ts
sql.unsafe`
  SELECT (${sql.join([1, 2], sql.fragment`, `)})
`

// SELECT ($1, $2)
```

Tuple list:

```ts
sql.unsafe`
  SELECT ${sql.join(
    [
      sql.fragment`(${sql.join([1, 2], sql.fragment`, `)})`,
      sql.fragment`(${sql.join([3, 4], sql.fragment`, `)})`,
    ],
    sql.fragment`, `
  )}
`

// SELECT ($1, $2), ($3, $4)
```

<a name="user-content-slonik-query-building-sql-json"></a>
<a name="slonik-query-building-sql-json"></a>
### <code>sql.json</code>

```ts
(
  value: SerializableValue
) => JsonSqlToken;
```

Serializes value and binds it as a JSON string literal, e.g.

```ts
await connection.query(sql.unsafe`
  SELECT (${sql.json([1, 2, 3])})
`);
```

Produces:

```ts
{
  sql: 'SELECT $1::json',
  values: [
    '[1,2,3]'
  ]
}
```

<a name="user-content-slonik-query-building-sql-jsonb"></a>
<a name="slonik-query-building-sql-jsonb"></a>
### <code>sql.jsonb</code>

```ts
(
  value: SerializableValue
) => JsonBinarySqlToken;
```

Serializes value and binds it as a JSON binary, e.g.

```ts
await connection.query(sql.unsafe`
  SELECT (${sql.jsonb([1, 2, 3])})
`);
```

Produces:

```ts
{
  sql: 'SELECT $1::jsonb',
  values: [
    '[1,2,3]'
  ]
}
```

<a name="user-content-slonik-query-building-sql-literalvalue"></a>
<a name="slonik-query-building-sql-literalvalue"></a>
### <code>sql.literalValue</code>

> ⚠️ Do not use. This method interpolates values as literals and it must be used only for [building utility statements](#user-content-slonik-recipes-building-utility-statements). You are most likely looking for [value placeholders](#user-content-slonik-value-placeholders).

```ts
(
  value: string,
) => SqlSqlToken;
```

Escapes and interpolates a literal value into a query.

```ts
await connection.query(sql.unsafe`
  CREATE USER "foo" WITH PASSWORD ${sql.literalValue('bar')}
`);
```

Produces:

```ts
{
  sql: 'CREATE USER "foo" WITH PASSWORD \'bar\''
}
```

<a name="user-content-slonik-query-building-sql-timestamp"></a>
<a name="slonik-query-building-sql-timestamp"></a>
### <code>sql.timestamp</code>

```ts
(
  date: Date
) => TimestampSqlToken;
```

Inserts a timestamp, e.g.

```ts
await connection.query(sql.unsafe`
  SELECT ${sql.timestamp(new Date('2022-08-19T03:27:24.951Z'))}
`);
```

Produces:

```ts
{
  sql: 'SELECT to_timestamp($1)',
  values: [
    '1660879644.951'
  ]
}
```

<a name="user-content-slonik-query-building-sql-unnest"></a>
<a name="slonik-query-building-sql-unnest"></a>
### <code>sql.unnest</code>

```ts
(
  tuples: ReadonlyArray<readonly any[]>,
  columnTypes:  Array<[...string[], TypeNameIdentifier]> | Array<SqlSqlToken | TypeNameIdentifier>
): UnnestSqlToken;
```

Creates an `unnest` expressions, e.g.

```ts
await connection.query(sql.unsafe`
  SELECT bar, baz
  FROM ${sql.unnest(
    [
      [1, 'foo'],
      [2, 'bar']
    ],
    [
      'int4',
      'text'
    ]
  )} AS foo(bar, baz)
`);
```

Produces:

```ts
{
  sql: 'SELECT bar, baz FROM unnest($1::"int4"[], $2::"text"[]) AS foo(bar, baz)',
  values: [
    [
      1,
      2
    ],
    [
      'foo',
      'bar'
    ]
  ]
}
```

If `columnType` array member type is `string`, it will treat it as a type name identifier (and quote with double quotes; illustrated in the example above).

If `columnType` array member type is `SqlToken`, it will inline type name without quotes, e.g.

```ts
await connection.query(sql.unsafe`
  SELECT bar, baz
  FROM ${sql.unnest(
    [
      [1, 'foo'],
      [2, 'bar']
    ],
    [
      sql.fragment`integer`,
      sql.fragment`text`
    ]
  )} AS foo(bar, baz)
`);
```

Produces:

```ts
{
  sql: 'SELECT bar, baz FROM unnest($1::integer[], $2::text[]) AS foo(bar, baz)',
  values: [
    [
      1,
      2
    ],
    [
      'foo',
      'bar'
    ]
  ]
}
```

If `columnType` array member type is `[...string[], TypeNameIdentifier]`, it will act as [`sql.identifier`](#user-content-sqlidentifier), e.g.

```ts
await connection.query(sql.unsafe`
  SELECT bar, baz
  FROM ${sql.unnest(
    [
      [1, 3],
      [2, 4]
    ],
    [
      ['foo', 'int4'],
      ['foo', 'int4']
    ]
  )} AS foo(bar, baz)
`);
```

Produces:

```ts
{
  sql: 'SELECT bar, baz FROM unnest($1::"foo"."int4"[], $2::"foo"."int4"[]) AS foo(bar, baz)',
  values: [
    [
      1,
      2
    ],
    [
      3,
      4
    ]
  ]
}
```

<a name="user-content-slonik-query-building-sql-unsafe"></a>
<a name="slonik-query-building-sql-unsafe"></a>
### <code>sql.unsafe</code>

```ts
(
  template: TemplateStringsArray,
  ...values: ValueExpression[]
) => QuerySqlToken;
```

Creates a query with Zod `any` type. The result of such a query has TypeScript type `any`.

```ts
const result = await connection.one(sql.unsafe`
  SELECT foo
  FROM bar
`);

// `result` type is `any`
```

`sql.unsafe` is effectively a shortcut to `sql.type(z.any())`.

`sql.unsafe` is as a convenience method for development. Your production code must not use `sql.unsafe`. Instead,

* Use `sql.type` to type the query result
* Use `sql.typeAlias` to alias an existing type
* Use `sql.fragment` if you are writing a fragment of a query

<a name="user-content-slonik-query-methods"></a>
<a name="slonik-query-methods"></a>
## Query methods

<a name="user-content-slonik-query-methods-any"></a>
<a name="slonik-query-methods-any"></a>
### <code>any</code>

Returns result rows.

Example:

```ts
const rows = await connection.any(sql.typeAlias('foo')`SELECT foo`);
```

`#any` is similar to `#query` except that it returns rows without fields information.

<a name="user-content-slonik-query-methods-anyfirst"></a>
<a name="slonik-query-methods-anyfirst"></a>
### <code>anyFirst</code>

Returns value of the first column of every row in the result set.

* Throws `DataIntegrityError` if query returns multiple columns.

Example:

```ts
const fooValues = await connection.anyFirst(sql.typeAlias('foo')`SELECT foo`);
```

<a name="user-content-slonik-query-methods-exists"></a>
<a name="slonik-query-methods-exists"></a>
### <code>exists</code>

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

<a name="user-content-slonik-query-methods-copyfrombinary"></a>
<a name="slonik-query-methods-copyfrombinary"></a>
### <code>copyFromBinary</code>

```ts
(
  streamQuery: QuerySqlToken,
  tupleList: any[][],
  columnTypes: TypeNameIdentifier[],
) => Promise<null>;
```

Copies from a binary stream.

The binary stream is constructed using user supplied `tupleList` and `columnTypes` values.

Example:

```ts
const tupleList = [
  [
    1,
    'baz'
  ],
  [
    2,
    'baz'
  ]
];

const columnTypes = [
  'int4',
  'text'
];

await connection.copyFromBinary(
  sql.unsafe`
    COPY foo
    (
      id,
      baz
    )
    FROM STDIN BINARY
  `,
  tupleList,
  columnTypes
);
```

<a name="user-content-slonik-query-methods-copyfrombinary-limitations"></a>
<a name="slonik-query-methods-copyfrombinary-limitations"></a>
#### Limitations

* Tuples cannot contain `NULL` values.

<a name="user-content-slonik-query-methods-copyfrombinary-implementation-notes"></a>
<a name="slonik-query-methods-copyfrombinary-implementation-notes"></a>
#### Implementation notes

`copyFromBinary` implementation is designed to minimize the query execution time at the cost of increased script memory usage and execution time. This is achieved by separating data encoding from feeding data to PostgreSQL, i.e. all data passed to `copyFromBinary` is first encoded and then fed to PostgreSQL (contrast this to using a stream with encoding transformation to feed data to PostgreSQL).

<a name="user-content-slonik-query-methods-copyfrombinary-related-documentation"></a>
<a name="slonik-query-methods-copyfrombinary-related-documentation"></a>
#### Related documentation

* [`COPY` documentation](https://www.postgresql.org/docs/current/sql-copy.html)

<a name="user-content-slonik-query-methods-many"></a>
<a name="slonik-query-methods-many"></a>
### <code>many</code>

Returns result rows.

* Throws `NotFoundError` if query returns no rows.

Example:

```ts
const rows = await connection.many(sql.typeAlias('foo')`SELECT foo`);
```

<a name="user-content-slonik-query-methods-manyfirst"></a>
<a name="slonik-query-methods-manyfirst"></a>
### <code>manyFirst</code>

Returns value of the first column of every row in the result set.

* Throws `NotFoundError` if query returns no rows.
* Throws `DataIntegrityError` if query returns multiple columns.

Example:

```ts
const fooValues = await connection.many(sql.typeAlias('foo')`SELECT foo`);
```

<a name="user-content-slonik-query-methods-maybeone"></a>
<a name="slonik-query-methods-maybeone"></a>
### <code>maybeOne</code>

Selects the first row from the result.

* Returns `null` if row is not found.
* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```ts
const row = await connection.maybeOne(sql.typeAlias('foo')`SELECT foo`);

// row.foo is the result of the `foo` column value of the first row.
```

<a name="user-content-slonik-query-methods-maybeonefirst"></a>
<a name="slonik-query-methods-maybeonefirst"></a>
### <code>maybeOneFirst</code>

Returns value of the first column from the first row.

* Returns `null` if row is not found.
* Throws `DataIntegrityError` if query returns multiple rows.
* Throws `DataIntegrityError` if query returns multiple columns.

Example:

```ts
const foo = await connection.maybeOneFirst(sql.typeAlias('foo')`SELECT foo`);

// foo is the result of the `foo` column value of the first row.
```

<a name="user-content-slonik-query-methods-one"></a>
<a name="slonik-query-methods-one"></a>
### <code>one</code>

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

<a name="user-content-slonik-query-methods-onefirst"></a>
<a name="slonik-query-methods-onefirst"></a>
### <code>oneFirst</code>

Returns value of the first column from the first row.

* Throws `NotFoundError` if query returns no rows.
* Throws `DataIntegrityError` if query returns multiple rows.
* Throws `DataIntegrityError` if query returns multiple columns.

Example:

```ts
const foo = await connection.oneFirst(sql.typeAlias('foo')`SELECT foo`);

// foo is the result of the `foo` column value of the first row.
```

<a name="user-content-slonik-query-methods-query"></a>
<a name="slonik-query-methods-query"></a>
### <code>query</code>

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

<a name="user-content-slonik-query-methods-stream"></a>
<a name="slonik-query-methods-stream"></a>
### <code>stream</code>

Streams query results.

Example:

```ts
await connection.stream(sql.typeAlias('foo')`SELECT foo`, (stream) => {
  stream.on('data', (datum) => {
    datum;
    // {
    //   fields: [
    //     {
    //       name: 'foo',
    //       dataTypeId: 23,
    //     }
    //   ],
    //   row: {
    //     foo: 'bar'
    //   }
    // }
  });
});
```

Note: Implemented using [`pg-query-stream`](https://github.com/brianc/node-pg-query-stream).

<a name="user-content-slonik-query-methods-transaction"></a>
<a name="slonik-query-methods-transaction"></a>
### <code>transaction</code>

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

<a name="user-content-slonik-query-methods-transaction-transaction-nesting"></a>
<a name="slonik-query-methods-transaction-transaction-nesting"></a>
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

<a name="user-content-slonik-query-methods-transaction-transaction-retrying"></a>
<a name="slonik-query-methods-transaction-transaction-retrying"></a>
#### Transaction retrying

Transactions that are failing with [Transaction Rollback](https://www.postgresql.org/docs/current/errcodes-appendix.html) class errors are automatically retried.

A failing transaction will be rolled back and the callback function passed to the transaction method call will be executed again. Nested transactions are also retried until the retry limit is reached. If the nested transaction keeps failing with a [Transaction Rollback](https://www.postgresql.org/docs/current/errcodes-appendix.html) error, then the parent transaction will be retried until the retry limit is reached.

How many times a transaction is retried is controlled using `transactionRetryLimit` configuration (default: 5) and the `transactionRetryLimit` parameter of the `transaction` method (default: undefined). If a `transactionRetryLimit` is given to the method call then it is used otherwise the `transactionRetryLimit` configuration is used.

<a name="user-content-slonik-query-methods-transaction-query-retrying"></a>
<a name="slonik-query-methods-transaction-query-retrying"></a>
#### Query retrying

A single query (not part of a transaction) failing with a [Transaction Rollback](https://www.postgresql.org/docs/current/errcodes-appendix.html) class error is automatically retried.

How many times it is retried is controlled by using the `queryRetryLimit` configuration (default: 5).


<a name="user-content-slonik-utilities"></a>
<a name="slonik-utilities"></a>
## Utilities

<a name="user-content-slonik-utilities-parsedsn"></a>
<a name="slonik-utilities-parsedsn"></a>
### <code>parseDsn</code>

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

<a name="user-content-slonik-utilities-stringifydsn"></a>
<a name="slonik-utilities-stringifydsn"></a>
### <code>stringifyDsn</code>

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


<a name="user-content-slonik-error-handling"></a>
<a name="slonik-error-handling"></a>
## Error handling

All Slonik errors extend from `SlonikError`, i.e. You can catch Slonik specific errors using the following logic.

```ts
import {
  SlonikError
} from 'slonik';

try {
  await query();
} catch (error) {
  if (error instanceof SlonikError) {
    // This error is thrown by Slonik.
  }
}
```

<a name="user-content-slonik-error-handling-original-node-postgres-error"></a>
<a name="slonik-error-handling-original-node-postgres-error"></a>
### Original <code>node-postgres</code> error

When error originates from `node-postgres`, the original error is available under `originalError` property.

This property is exposed for debugging purposes only. Do not use it for conditional checks – it can change.

If you require to extract meta-data about a specific type of error (e.g. constraint violation name), raise a GitHub issue describing your use case.

<a name="user-content-slonik-error-handling-handling-backendterminatederror"></a>
<a name="slonik-error-handling-handling-backendterminatederror"></a>
### Handling <code>BackendTerminatedError</code>

`BackendTerminatedError` is thrown when the backend is terminated by the user, i.e. [`pg_terminate_backend`](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADMIN-SIGNAL).

`BackendTerminatedError` must be handled at the connection level, i.e.

```ts
await pool.connect(async (connection0) => {
  try {
    await pool.connect(async (connection1) => {
      const backendProcessId = await connection1.oneFirst(sql.typeAlias('id')`SELECT pg_backend_pid() AS id`);

      setTimeout(() => {
        connection0.query(sql.typeAlias('void')`SELECT pg_cancel_backend(${backendProcessId})`)
      }, 2000);

      try {
        await connection1.query(sql.typeAlias('void')`SELECT pg_sleep(30)`);
      } catch (error) {
        // This code will not be executed.
      }
    });
  } catch (error) {
    if (error instanceof BackendTerminatedError) {
      // Handle backend termination.
    } else {
      throw error;
    }
  }
});
```

<a name="user-content-slonik-error-handling-handling-checkintegrityconstraintviolationerror"></a>
<a name="slonik-error-handling-handling-checkintegrityconstraintviolationerror"></a>
### Handling <code>CheckIntegrityConstraintViolationError</code>

`CheckIntegrityConstraintViolationError` is thrown when PostgreSQL responds with [`check_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23514`) error.

<a name="user-content-slonik-error-handling-handling-connectionerror"></a>
<a name="slonik-error-handling-handling-connectionerror"></a>
### Handling <code>ConnectionError</code>

`ConnectionError` is thrown when connection cannot be established to the PostgreSQL server.

<a name="user-content-slonik-error-handling-handling-dataintegrityerror"></a>
<a name="slonik-error-handling-handling-dataintegrityerror"></a>
### Handling <code>DataIntegrityError</code>

To handle the case where the data result does not match the expectations, catch `DataIntegrityError` error.

```ts
import {
  DataIntegrityError
} from 'slonik';

let row;

try {
  row = await connection.one(sql.typeAlias('foo')`SELECT foo`);
} catch (error) {
  if (error instanceof DataIntegrityError) {
    console.error('There is more than one row matching the select criteria.');
  } else {
    throw error;
  }
}
```

<a name="user-content-slonik-error-handling-handling-foreignkeyintegrityconstraintviolationerror"></a>
<a name="slonik-error-handling-handling-foreignkeyintegrityconstraintviolationerror"></a>
### Handling <code>ForeignKeyIntegrityConstraintViolationError</code>

`ForeignKeyIntegrityConstraintViolationError` is thrown when PostgreSQL responds with [`foreign_key_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23503`) error.

<a name="user-content-slonik-error-handling-handling-notfounderror"></a>
<a name="slonik-error-handling-handling-notfounderror"></a>
### Handling <code>NotFoundError</code>

To handle the case where query returns less than one row, catch `NotFoundError` error.

```ts
import {
  NotFoundError
} from 'slonik';

let row;

try {
  row = await connection.one(sql.typeAlias('foo')`SELECT foo`);
} catch (error) {
  if (!(error instanceof NotFoundError)) {
    throw error;
  }
}

if (row) {
  // row.foo is the result of the `foo` column value of the first row.
}
```

<a name="user-content-slonik-error-handling-handling-notnullintegrityconstraintviolationerror"></a>
<a name="slonik-error-handling-handling-notnullintegrityconstraintviolationerror"></a>
### Handling <code>NotNullIntegrityConstraintViolationError</code>

`NotNullIntegrityConstraintViolationError` is thrown when PostgreSQL responds with [`not_null_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23502`) error.

<a name="user-content-slonik-error-handling-handling-statementcancellederror"></a>
<a name="slonik-error-handling-handling-statementcancellederror"></a>
### Handling <code>StatementCancelledError</code>

`StatementCancelledError` is thrown when a query is cancelled by the user (i.e. [`pg_cancel_backend`](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADMIN-SIGNAL)) or in case of a timeout.

It should be safe to use the same connection if `StatementCancelledError` is handled, e.g.

```ts
await pool.connect(async (connection0) => {
  await pool.connect(async (connection1) => {
    const backendProcessId = await connection1.oneFirst(sql.typeAlias('id')`SELECT pg_backend_pid() AS id`);

    setTimeout(() => {
      connection0.query(sql.typeAlias('void')`SELECT pg_cancel_backend(${backendProcessId})`)
    }, 2000);

    try {
      await connection1.query(sql.typeAlias('void')`SELECT pg_sleep(30)`);
    } catch (error) {
      if (error instanceof StatementCancelledError) {
        // Safe to continue using the same connection.
      } else {
        throw error;
      }
    }
  });
});
```

<a name="user-content-slonik-error-handling-handling-statementtimeouterror"></a>
<a name="slonik-error-handling-handling-statementtimeouterror"></a>
### Handling <code>StatementTimeoutError</code>

`StatementTimeoutError` inherits from `StatementCancelledError` and it is called only in case of a timeout.

<a name="user-content-slonik-error-handling-handling-uniqueintegrityconstraintviolationerror"></a>
<a name="slonik-error-handling-handling-uniqueintegrityconstraintviolationerror"></a>
### Handling <code>UniqueIntegrityConstraintViolationError</code>

`UniqueIntegrityConstraintViolationError` is thrown when PostgreSQL responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23505`) error.

<a name="user-content-slonik-error-handling-handling-tuplemovedtoanotherpartitionerror"></a>
<a name="slonik-error-handling-handling-tuplemovedtoanotherpartitionerror"></a>
### Handling <code>TupleMovedToAnotherPartitionError</code>

`TupleMovedToAnotherPartitionError` is thrown when [`affecting tuple moved into different partition`](https://github.com/postgres/postgres/commit/f16241bef7cc271bff60e23de2f827a10e50dde8).


<a name="user-content-slonik-migrations"></a>
<a name="slonik-migrations"></a>
## Migrations

This library intentionally doesn't handle migrations, because a database client and migrations are conceptually distinct problems.

My personal preference is to use [Flyway](https://flywaydb.org/) – it is a robust solution that many DBAs are already familiar with.

The Slonik community has also shared their successes with these Node.js frameworks:

* [`node-pg-migrate`](https://github.com/salsita/node-pg-migrate)
* [`@slonik/migrator`](https://www.npmjs.com/package/@slonik/migrator)

<a name="user-content-slonik-types"></a>
<a name="slonik-types"></a>
## Types

This package is using [TypeScript](http://typescriptlang.org/) types.

Refer to [`./src/types.ts`](./src/types.ts).

The public interface exports the following types:

* `CommonQueryMethods` (most generic)
* `DatabaseConnection` (`DatabasePool | DatabasePoolConnection`)
* `DatabasePool`
* `DatabasePoolConnection`
* `DatabaseTransactionConnection`

Use these types to annotate `connection` instance in your code base, e.g.

```ts
import {
  type DatabaseConnection
} from 'slonik';

export default async (
  connection: DatabaseConnection,
  code: string
): Promise<number> => {
  return await connection.oneFirst(sql.typeAlias('id')`
    SELECT id
    FROM country
    WHERE code = ${code}
  `);
};
```

See [runtime validation](#user-content-runtime-validation).

<a name="user-content-slonik-debugging"></a>
<a name="slonik-debugging"></a>
## Debugging

<a name="user-content-slonik-debugging-logging"></a>
<a name="slonik-debugging-logging"></a>
### Logging

Slonik uses [roarr](https://github.com/gajus/roarr) to log queries.

To enable logging, define `ROARR_LOG=true` environment variable.

By default, Slonik logs only connection events, e.g. when connection is created, connection is acquired and notices.

Query-level logging can be added using [`slonik-interceptor-query-logging`](https://github.com/gajus/slonik-interceptor-query-logging) interceptor.

<a name="user-content-slonik-debugging-capture-stack-trace"></a>
<a name="slonik-debugging-capture-stack-trace"></a>
### Capture stack trace

Note: Requires [`slonik-interceptor-query-logging`](https://github.com/gajus/slonik-interceptor-query-logging).

Enabling `captureStackTrace` configuration will create a stack trace before invoking the query and include the stack trace in the logs, e.g.

```tson
{
  "context": {
    "package": "slonik",
    "namespace": "slonik",
    "logLevel": 20,
    "executionTime": "357 ms",
    "queryId": "01CV2V5S4H57KCYFFBS0BJ8K7E",
    "rowCount": 1,
    "sql": "SELECT schedule_cinema_data_task();",
    "stackTrace": [
      "/node_modules/slonik/dist:162:28",
      "/node_modules/slonik/dist:314:12",
      "/node_modules/slonik/dist:361:20",
      "/node_modules/slonik/dist/utilities:17:13",
      "/src/bin/commands/do-cinema-data-tasks.js:59:21",
      "/src/bin/commands/do-cinema-data-tasks.js:590:45",
      "internal/process/next_tick.js:68:7"
    ],
    "values": []
  },
  "message": "query",
  "sequence": 4,
  "time": 1540915127833,
  "version": "1.0.0"
}
{
  "context": {
    "package": "slonik",
    "namespace": "slonik",
    "logLevel": 20,
    "executionTime": "66 ms",
    "queryId": "01CV2V5SGS0WHJX4GJN09Z3MTB",
    "rowCount": 1,
    "sql": "SELECT cinema_id \"cinemaId\", target_data \"targetData\" FROM cinema_data_task WHERE id = ?",
    "stackTrace": [
      "/node_modules/slonik/dist:162:28",
      "/node_modules/slonik/dist:285:12",
      "/node_modules/slonik/dist/utilities:17:13",
      "/src/bin/commands/do-cinema-data-tasks.js:603:26",
      "internal/process/next_tick.js:68:7"
    ],
    "values": [
      17953947
    ]
  },
  "message": "query",
  "sequence": 5,
  "time": 1540915127902,
  "version": "1.0.0"
}
```

Use [`@roarr/cli`](https://github.com/gajus/roarr-cli) to pretty-print the output.

![Log Roarr pretty-print output.](./.README/log-roarr-pretty-print-output.png)


<a name="user-content-slonik-syntax-highlighting"></a>
<a name="slonik-syntax-highlighting"></a>
## Syntax Highlighting

<a name="user-content-slonik-syntax-highlighting-atom-syntax-highlighting-plugin"></a>
<a name="slonik-syntax-highlighting-atom-syntax-highlighting-plugin"></a>
### Atom Syntax Highlighting Plugin

Using [Atom](https://atom.io/) IDE you can leverage the [`language-babel`](https://github.com/gandm/language-babel) package in combination with the [`language-sql`](https://github.com/atom/language-sql) to enable highlighting of the SQL strings in the codebase.

![Syntax highlighting in Atom](./.README/atom-syntax-highlighting.png)

To enable highlighting, you need to:

1. Install `language-babel` and `language-sql` packages.
1. Configure `language-babel` "JavaScript Tagged Template Literal Grammar Extensions" setting to use `language-sql` to highlight template literals with `sql` tag (configuration value: `sql:source.sql`).
1. Use [`sql` helper to construct the queries](https://github.com/gajus/slonik#tagged-template-literals).

For more information, refer to the [JavaScript Tagged Template Literal Grammar Extensions](https://github.com/gandm/language-babel#javascript-tagged-template-literal-grammar-extensions) documentation of `language-babel` package.

<a name="user-content-slonik-syntax-highlighting-vs-code-syntax-highlighting-extension"></a>
<a name="slonik-syntax-highlighting-vs-code-syntax-highlighting-extension"></a>
### VS Code Syntax Highlighting Extension

The [`vscode-sql-lit` extension](https://marketplace.visualstudio.com/items?itemName=thebearingedge.vscode-sql-lit) provides syntax highlighting for VS Code:
![Syntax highlighting in VS Code](./.README/vscode-syntax-highlighting.png)

<a name="user-content-slonik-development"></a>
<a name="slonik-development"></a>
## Development

Running Slonik tests requires having a local PostgreSQL instance.

The easiest way to setup a temporary instance for testing is using Docker, e.g.

```bash
docker run --rm -it -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 postgres
```
