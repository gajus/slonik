<a name="slonik"></a>
# Slonik

[![Travis build status](http://img.shields.io/travis/gajus/slonik/master.svg?style=flat-square)](https://travis-ci.org/gajus/slonik)
[![Coveralls](https://img.shields.io/coveralls/gajus/slonik.svg?style=flat-square)](https://coveralls.io/github/gajus/slonik)
[![NPM version](http://img.shields.io/npm/v/slonik.svg?style=flat-square)](https://www.npmjs.org/package/slonik)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A [battle-tested](#battle-tested) PostgreSQL client with strict types, detail logging and assertions.

![Tailing Slonik logs](./.README/slonik-log-tailing.gif)

<a name="slonik-features"></a>
## Features

* [Assertions and type safety](#repeating-code-patterns-and-type-safety)
* [Safe connection handling](#protecting-against-unsafe-connection-handling).
* [Safe transaction handling](#protecting-against-unsafe-transaction-handling).
* [Safe value interpolation](#protecting-against-unsafe-value-interpolation).
* Detail [logging](#slonik-debugging).
* [Asynchronous stack trace resolution](#log-stack-trace).
* [Middlewares](#slonik-interceptors).
* [Mapped errors](#error-handling).
* [Atom plugin](#slonik-syntax-highlighting).
* [ESLint plugin](https://github.com/gajus/eslint-plugin-sql).

<a name="slonik-about-slonik"></a>
## About Slonik

<a name="slonik-about-slonik-battle-tested"></a>
### Battle-Tested

Slonik began as a collection of utilities designed for working with [`node-postgres`](https://github.com/brianc/node-postgres). We continue to use `node-postgres` as it provides a robust foundation for interacting with PostgreSQL. However, what once was a collection of utilities has since grown into a framework that abstracts repeating code patterns, protects against unsafe connection handling and value interpolation, and provides rich debugging experience.

Slonik has been [battle-tested](https://medium.com/@gajus/lessons-learned-scaling-postgresql-database-to-1-2bn-records-month-edc5449b3067) with large data volumes and queries ranging from simple CRUD operations to data-warehousing needs.

<a name="slonik-about-slonik-origin-of-the-name"></a>
### Origin of the name

![Slonik](./.README/postgresql-elephant.png)

The name of the elephant depicted in the official PostgreSQL logo is Slonik. The name itself is derived from the Russian word for "little elephant".

Read: [The History of Slonik, the PostgreSQL Elephant Logo](https://www.vertabelo.com/blog/notes-from-the-lab/the-history-of-slonik-the-postgresql-elephant-logo)

<a name="slonik-about-slonik-repeating-code-patterns-and-type-safety"></a>
### Repeating code patterns and type safety

Among the primary reasons for developing Slonik, was the motivation to reduce the repeating code patterns and add a level of type safety. This is primarily achieved through the methods such as `one`, `many`, etc. But what is the issue? It is best illustrated with an example.

Suppose the requirement is to write a method that retrieves a resource ID given values defining (what we assume to be) a unique constraint. If we did not have the aforementioned convenience methods available, then it would need to be written as:

```js
// @flow
import {
  sql
} from 'slonik';
import type {
  DatabaseConnectionType
} from 'slonik';

opaque type DatabaseRecordIdType = number;

const getFooIdByBar = async (connection: DatabaseConnectionType, bar: string): Promise<DatabaseRecordIdType> => {
  const fooResult = await connection.query(sql`
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

```js
const getFooIdByBar = (connection: DatabaseConnectionType, bar: string): Promise<DatabaseRecordIdType> => {
  return connection.oneFirst(sql`
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

This becomes particularly important when writing routines where multiple queries depend on the previous result. Using methods with inbuilt assertions ensures that in case of an error, the error points to the original source of the problem. In contrast, unless assertions for all possible outcomes are typed out as in the previous example, the unexpected result of the query will be fed to the next operation. If you are lucky, the next operation will simply break; if you are unlucky, you are risking data corruption and hard to locate bugs.

Furthermore, using methods that guarantee the shape of the results, allows us to leverage static type checking and catch some of the errors even before they executing the code, e.g.

```js
const fooId = await connection.many(sql`
  SELECT id
  FROM foo
  WHERE bar = ${bar}
`);

await connection.query(sql`
  DELETE FROM baz
  WHERE foo_id = ${fooId}
`);

```

Static type check of the above example will produce a warning as the `fooId` is guaranteed to be an array and binding of the last query is expecting a primitive value.

<a name="slonik-about-slonik-protecting-against-unsafe-connection-handling"></a>
### Protecting against unsafe connection handling

Slonik only allows to check out a connection for the duration of the promise routine supplied to the `pool#connect()` method.

The primary reason for implementing _only_ this connection pooling method is because the alternative is inherently unsafe, e.g.

```js
// Note: This example is using unsupported API.

const main = async () => {
  const connection = await pool.connect();

  await connection.query(sql`SELECT foo()`);

  await connection.release();
};

```

In this example, if `SELECT foo()` produces an error, then connection is never released, i.e. the connection remains to hang.

A fix to the above is to ensure that `connection#release()` is always called, i.e.

```js
// Note: This example is using unsupported API.

const main = async () => {
  const connection = await pool.connect();

  let lastExecutionResult;

  try {
    lastExecutionResult = await connection.query(sql`SELECT foo()`);
  } finally {
    await connection.release();
  }

  return lastExecutionResult;
};

```

Slonik abstracts the latter pattern into `pool#connect()` method.

```js
const main = () => {
  return pool.connect((connection) => {
    return connection.query(sql`SELECT foo()`);
  });
};

```

Connection is always released back to the pool after the promise produced by the function supplied to `connect()` method is either resolved or rejected.

<a name="slonik-about-slonik-protecting-against-unsafe-transaction-handling"></a>
### Protecting against unsafe transaction handling

Just like in the [unsafe connection handling](#protecting-against-unsafe-connection-handling) described above, Slonik only allows to create a transaction for the duration of the promise routine supplied to the `connection#transaction()` method.

```js
connection.transaction(async (transactionConnection) => {
  await transactionConnection.query(sql`INSERT INTO foo (bar) VALUES ('baz')`);
  await transactionConnection.query(sql`INSERT INTO qux (quux) VALUES ('quuz')`);
});

```

This pattern ensures that the transaction is either committed or aborted the moment the promise is either resolved or rejected.

<a name="slonik-about-slonik-protecting-against-unsafe-value-interpolation"></a>
### Protecting against unsafe value interpolation

[SQL injections](https://en.wikipedia.org/wiki/SQL_injection) are one of the most well known attack vectors. Some of the [biggest data leaks](https://en.wikipedia.org/wiki/SQL_injection#Examples) were the consequence of improper user-input handling. In general, SQL injections are easily preventable by using parameterization and by restricting database permissions, e.g.

```js
// Note: This example is using unsupported API.

connection.query('SELECT $1', [
  userInput
]);

```

In this example, the query text (`SELECT $1`) and parameters (value of the `userInput`) are passed to the PostgreSQL server where the parameters are safely substituted into the query. This is a safe way to execute a query using user-input.

The vulnerabilities appear when developers cut corners or when they do not know about parameterization, i.e. there is a risk that someone will instead write:

```js
// Note: This example is using unsupported API.

connection.query('SELECT \'' + userInput + '\'');

```

As evident by the history of the data leaks, this happens more often than anyone would like to admit. This is especially a big risk in Node.js community, where predominant number of developers are coming from frontend and have not had training working with RDBMSes. Therefore, one of the key selling points of Slonik is that it adds multiple layers of protection to prevent unsafe handling of user-input.

To begin with, Slonik does not allow to run plain-text queries.

```js
connection.query('SELECT 1');

```

The above invocation would produce an error:

> TypeError: Query must be constructed using `sql` tagged template literal.

This means that the only way to run a query is by constructing it using [`sql` tagged template literal](https://github.com/gajus/slonik#slonik-value-placeholders-tagged-template-literals), e.g.

```js
connection.query(sql`SELECT 1`);

```

To add a parameter to the query, user must use [template literal placeholders](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Description), e.g.

```js
connection.query(sql`SELECT ${userInput}`);

```

Slonik takes over from here and constructs a query with value bindings, and sends the resulting query text and parameters to the PostgreSQL. As `sql` tagged template literal is the only way to execute the query, it adds a strong layer of protection against accidental unsafe user-input handling due to limited knowledge of the SQL client API.

As Slonik restricts user's ability to generate and execute dynamic SQL, it provides helper functions used to generate fragments of the query and the corresponding value bindings, e.g. [`sql.identifier`](#sqlidentifier), [`sql.tuple`](#sqltuple), [`sql.tupleList`](#sqltuplelist), [`sql.unnest`](#sqlunnest) and [`sql.valueList`](#sqlvaluelist). These methods generate tokens that the query executor interprets to construct a safe query, e.g.

```js
connection.query(sql`
  SELECT ${sql.identifier(['foo', 'a'])}
  FROM (
    VALUES ${sql.tupleList([['a1', 'b1', 'c1'], ['a2', 'b2', 'c2']])}
  ) foo(a, b, c)
  WHERE foo.b IN (${sql.tuple(['c1', 'a2'])})
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

That is executed with the parameters provided by the user.

Finally, if there comes a day that you _must_ generate the whole or a fragment of a query using string concatenation, then Slonik provides [`sql.raw`](#sqlraw) method. However, even when using `sql.raw`, we derisk the dangers of generating SQL by allowing developer to bind values only to the scope of the fragment that is being generated, e.g.

```js
sql`
  SELECT ${sql.raw('$1', ['foo'])}
`;

```

Allowing to bind values only to the scope of the SQL that is being generated reduces the amount of code that the developer needs to scan in order to be aware of the impact that the generated code can have. Continue reading [Using `sql.raw` to generate dynamic queries](#using-sqlraw-to-generate-dynamic-queries) to learn further about `sql.raw`.

To sum up, Slonik is designed to prevent accidental creation of queries vulnerable to SQL injections.


<a name="slonik-documentation"></a>
## Documentation

* [Slonik](#slonik)
    * [Features](#slonik-features)
    * [About Slonik](#slonik-about-slonik)
        * [Battle-Tested](#slonik-about-slonik-battle-tested)
        * [Origin of the name](#slonik-about-slonik-origin-of-the-name)
        * [Repeating code patterns and type safety](#slonik-about-slonik-repeating-code-patterns-and-type-safety)
        * [Protecting against unsafe connection handling](#slonik-about-slonik-protecting-against-unsafe-connection-handling)
        * [Protecting against unsafe transaction handling](#slonik-about-slonik-protecting-against-unsafe-transaction-handling)
        * [Protecting against unsafe value interpolation](#slonik-about-slonik-protecting-against-unsafe-value-interpolation)
    * [Documentation](#slonik-documentation)
    * [Usage](#slonik-usage)
        * [Install](#slonik-usage-install)
        * [Create connection](#slonik-usage-create-connection)
        * [API](#slonik-usage-api)
        * [Default configuration](#slonik-usage-default-configuration)
        * [Checking out a client from the connection pool](#slonik-usage-checking-out-a-client-from-the-connection-pool)
    * [Interceptors](#slonik-interceptors)
        * [Interceptor methods](#slonik-interceptors-interceptor-methods)
    * [Built-in interceptors](#slonik-built-in-interceptors)
        * [Field name transformation interceptor](#slonik-built-in-interceptors-field-name-transformation-interceptor)
        * [Query normalization interceptor](#slonik-built-in-interceptors-query-normalization-interceptor)
        * [Benchmarking interceptor](#slonik-built-in-interceptors-benchmarking-interceptor)
    * [Recipes](#slonik-recipes)
        * [Inserting large number of rows](#slonik-recipes-inserting-large-number-of-rows)
        * [Logging `auto_explain`](#slonik-recipes-logging-auto_explain)
        * [Using `sql.raw` to generate dynamic queries](#slonik-recipes-using-sql-raw-to-generate-dynamic-queries)
    * [Conventions](#slonik-conventions)
        * [No multiline values](#slonik-conventions-no-multiline-values)
    * [Value placeholders](#slonik-value-placeholders)
        * [Tagged template literals](#slonik-value-placeholders-tagged-template-literals)
        * [`sql.valueList`](#slonik-value-placeholders-sql-valuelist)
        * [`sql.tuple`](#slonik-value-placeholders-sql-tuple)
        * [`sql.tupleList`](#slonik-value-placeholders-sql-tuplelist)
        * [`sql.unnset`](#slonik-value-placeholders-sql-unnset)
        * [`sql.identifier`](#slonik-value-placeholders-sql-identifier)
        * [`sql.raw`](#slonik-value-placeholders-sql-raw)
    * [Query methods](#slonik-query-methods)
        * [`any`](#slonik-query-methods-any)
        * [`anyFirst`](#slonik-query-methods-anyfirst)
        * [`insert`](#slonik-query-methods-insert)
        * [`many`](#slonik-query-methods-many)
        * [`manyFirst`](#slonik-query-methods-manyfirst)
        * [`maybeOne`](#slonik-query-methods-maybeone)
        * [`maybeOneFirst`](#slonik-query-methods-maybeonefirst)
        * [`one`](#slonik-query-methods-one)
        * [`oneFirst`](#slonik-query-methods-onefirst)
        * [`query`](#slonik-query-methods-query)
        * [`transaction`](#slonik-query-methods-transaction)
    * [Error handling](#slonik-error-handling)
        * [Handling `NotFoundError`](#slonik-error-handling-handling-notfounderror)
        * [Handling `DataIntegrityError`](#slonik-error-handling-handling-dataintegrityerror)
        * [Handling `NotNullIntegrityConstraintViolationError`](#slonik-error-handling-handling-notnullintegrityconstraintviolationerror)
        * [Handling `ForeignKeyIntegrityConstraintViolationError`](#slonik-error-handling-handling-foreignkeyintegrityconstraintviolationerror)
        * [Handling `UniqueIntegrityConstraintViolationError`](#slonik-error-handling-handling-uniqueintegrityconstraintviolationerror)
        * [Handling `CheckIntegrityConstraintViolationError`](#slonik-error-handling-handling-checkintegrityconstraintviolationerror)
    * [Types](#slonik-types)
    * [Debugging](#slonik-debugging)
        * [Logging](#slonik-debugging-logging)
        * [Log stack trace](#slonik-debugging-log-stack-trace)
    * [Syntax highlighting](#slonik-syntax-highlighting)
        * [Atom](#slonik-syntax-highlighting-atom)


<a name="slonik-usage"></a>
## Usage

<a name="slonik-usage-install"></a>
### Install

```bash
npm install slonik

```

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/gajus)
[![Become a Patron](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/gajus)

<a name="slonik-usage-create-connection"></a>
### Create connection

Use `createPool` to create a connection pool, e.g.

```js
import {
  createPool
} from 'slonik';

const pool = createPool('postgres://');

```

Instance of Slonik connection pool can be then used to create a new connection, e.g.

```js
pool.connect(async (connection) => {
  await connection.query(sql`SELECT 1`);
});

```

The connection will be kept alive until the promise resolves (the result of the method supplied to `connect()`).

Refer to [query method](#slonik-query-methods) documentation to learn about the connection methods.

If you do not require having a persistent connection to the same backend, then you can directly use `pool` to run queries, e.g.

```js
pool.query(sql`SELECT 1`);

```

Beware that in the latter example, the connection picked to execute the query is a random connection from the connection pool, i.e. using the latter method (without explicit `connect()`) does not guarantee that multiple queries will refer to the same backend.

<a name="slonik-usage-api"></a>
### API

```js
createPool(
  connectionConfiguration: DatabaseConfigurationType,
  clientConfiguration: ClientConfigurationType
): DatabasePoolType;

type DatabaseConnectionUriType = string;

type DatabaseConfigurationType =
  DatabaseConnectionUriType |
  {|
    +database?: string,
    +host?: string,
    +idleTimeoutMillis?: number,
    +max?: number,
    +password?: string,
    +port?: number,
    +user?: string
  |};

/**
 * @property interceptors An array of [Slonik interceptors](https://github.com/gajus/slonik#slonik-interceptors).
 */
type ClientConfigurationType = {|
  +interceptors?: $ReadOnlyArray<InterceptorType>
|};

```

Example:

```js
import {
  createPool
} from 'slonik';

const pool = createPool('postgres://');

await pool.query(sql`SELECT 1`);

```

<a name="slonik-usage-default-configuration"></a>
### Default configuration

[Field name transformation interceptor](#field-name-transformation-interceptor) and [Query normalization interceptor](#query-normalization-interceptor) are enabled by default.

To disable the default interceptors, pass an empty array, e.g.

```js
createPool('postgres://', {
  interceptos: []
});

```

<a name="slonik-usage-checking-out-a-client-from-the-connection-pool"></a>
### Checking out a client from the connection pool

Slonik only allows to check out a connection for the duration of the promise routine supplied to the `pool#connect()` method.

```js
import {
  createPool
} from 'slonik';

const pool = createPool('postgres://localhost');

const result = await pool.connect(async (connection) => {
  await connection.query(sql`SELECT 1`);
  await connection.query(sql`SELECT 2`);

  return 'foo';
});

result;
// 'foo'

```

Connection is released back to the pool after the promise produced by the function supplied to `connect()` method is either resolved or rejected.

Read: [Protecting against unsafe connection handling](#protecting-against-unsafe-connection-handling)


<a name="slonik-interceptors"></a>
## Interceptors

Functionality can be added to Slonik client by adding interceptors (middleware).

Interceptors are configured using [client configuration](#slonik-usage-configuration), e.g.

```js
import {
  createPool
} from 'slonik';

const interceptors = [];

const connection = createPool('postgres://', {
  interceptors
});

```

Interceptors are executed in the order they are added.

<a name="slonik-interceptors-interceptor-methods"></a>
### Interceptor methods

Interceptor is an object that implements methods that can change the behaviour of the database client at different stages of the connection life-cycle

```js
type InterceptorType = {|
  +afterPoolConnection?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType
  ) => MaybePromiseType<void>,
  +afterQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType,
    result: QueryResultType<QueryResultRowType>
  ) => MaybePromiseType<QueryResultType<QueryResultRowType>>,
  +beforePoolConnectionRelease?: (
    connectionContext: ConnectionContextType,
    connection: DatabasePoolConnectionType
  ) => MaybePromiseType<void>,
  +beforeQueryExecution?: (
    queryContext: QueryContextType,
    query: QueryType
  ) => MaybePromiseType<QueryResultType<QueryResultRowType>> | MaybePromiseType<void>,
  +transformQuery?: (
    queryContext: QueryContextType,
    query: QueryType
  ) => MaybePromiseType<QueryType>
|};

```

<a name="slonik-interceptors-interceptor-methods-afterpoolconnection"></a>
#### <code>afterPoolConnection</code>

Executed after a connection is acquired from the connection pool (or a new connection is created), e.g.

```js
const pool = createPool('postgres://');

// Interceptor is executed here. ↓
pool.connect();

```

<a name="slonik-interceptors-interceptor-methods-afterqueryexecution"></a>
#### <code>afterQueryExecution</code>

`afterQueryExecution` must return the result of the query, which will be passed down to the client.

Use `afterQuery` to modify the query result.

<a name="slonik-interceptors-interceptor-methods-beforequeryexecution"></a>
#### <code>beforeQueryExecution</code>

This function can optionally return a direct result of the query which will cause the actual query never to be executed.

<a name="slonik-interceptors-interceptor-methods-beforepoolconnectionrelease"></a>
#### <code>beforePoolConnectionRelease</code>

Executed before connection is released back to the connection pool, e.g.

```js
const pool = await createPool('postgres://');

pool.connect(async () => {
  await 1;

  // Interceptor is executed here. ↓
});

```

<a name="slonik-interceptors-interceptor-methods-transformquery"></a>
#### <code>transformQuery</code>

Executed before `beforeQueryExecution`.

Transforms query.

<a name="slonik-built-in-interceptors"></a>
## Built-in interceptors

<a name="slonik-built-in-interceptors-field-name-transformation-interceptor"></a>
### Field name transformation interceptor

`createFormatFieldNameInterceptor` creates an interceptor that formats query result field names.

This interceptor removes the necessity to alias field names, e.g.

```js
connection.any(sql`
  SELECT
    id,
    full_name "fullName"
  FROM person
`);

```

Field name formatter uses `afterQuery` interceptor to format field names.

<a name="slonik-built-in-interceptors-field-name-transformation-interceptor-api-1"></a>
#### API

```js
import {
  createFieldNameTransformationInterceptor
} from 'slonik';

```

```js
/**
 * @property format The only supported format is CAMEL_CASE.
 * @property test Tests whether the field should be formatted. The default behaviour is to include all fields that match ^[a-z0-9_]+$ regex.
 */
type ConfigurationType = {|
  +format: 'CAMEL_CASE',
  +test: (field: FieldType) => boolean
|};

(configuration: ConfigurationType) => InterceptorType;

```

<a name="slonik-built-in-interceptors-field-name-transformation-interceptor-example-usage"></a>
#### Example usage

```js
import {
  createFieldNameTransformationInterceptor,
  createPool
} from 'slonik';

const interceptors = [
  createFieldNameTransformationInterceptor({
    format: 'CAMEL_CASE'
  })
];

const connection = createPool('postgres://', {
  interceptors
});

connection.any(sql`
  SELECT
    id,
    full_name
  FROM person
`);

// [
//   {
//     id: 1,
//     fullName: 1
//   }
// ]

```

<a name="slonik-built-in-interceptors-query-normalization-interceptor"></a>
### Query normalization interceptor

Normalizes the query.

<a name="slonik-built-in-interceptors-query-normalization-interceptor-api-2"></a>
#### API

```js
import {
  createQueryNormalizationInterceptor
} from 'slonik';

```

```js
/**
 * @property stripComments Strips comments from the query (default: true).
 */
type ConfigurationType = {|
  +stripComments?: boolean
|};

(configuration?: ConfigurationType) => InterceptorType;

```

<a name="slonik-built-in-interceptors-benchmarking-interceptor"></a>
### Benchmarking interceptor

Summarizes all queries that were run during the life-time of a connection.

Example output:

```
╔═══════════════════════════════════════════════════════════════╤═══════════╤═════════╤═══════╗
║ Query                                                         │ Execution │ Average │ Total ║
║                                                               │ count     │ time    │ time  ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ SELECT id FROM seating_plan WHERE auditorium_id = $1 AND      │ 1         │ 176ms   │ 176ms ║
║ fingerprint = $2                                              │           │         │       ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ UPDATE event SET scrape_event_seating_session = $1,           │ 1         │ 176ms   │ 176ms ║
║ scrape_event_seating_session_created_at = now() WHERE id =    │           │         │       ║
║ $2                                                            │           │         │       ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ SELECT v1.cinema_id "cinemaId",                               │ 1         │ 182ms   │ 182ms ║
║ last_event_seating_plan_change.seating_plan_id                │           │         │       ║
║ "seatingPlanId" FROM event e1 INNER JOIN venue v1 ON v1.id =  │           │         │       ║
║ e1.venue_id INNER JOIN LATERAL ( SELECT DISTINCT ON           │           │         │       ║
║ (espc1.event_id) espc1.seating_plan_id FROM                   │           │         │       ║
║ event_seating_plan_change espc1 WHERE espc1.event_id = e1.id  │           │         │       ║
║ ORDER BY espc1.event_id, espc1.id DESC )                      │           │         │       ║
║ last_event_seating_plan_change ON TRUE WHERE e1.id = $1       │           │         │       ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ UPDATE event_seating_lookup SET ended_at =                    │ 1         │ 185ms   │ 185ms ║
║ statement_timestamp(), log = $1, lookup_is_successful = $2,   │           │         │       ║
║ error_name = $3, error_message = $4, error = $5 WHERE id =    │           │         │       ║
║ $6                                                            │           │         │       ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ SELECT s1.id, s1.location_column "locationColumn",            │ 1         │ 237ms   │ 237ms ║
║ s1.location_row "locationRow", sa1.fuid "seatingAreaFuid"     │           │         │       ║
║ FROM seat s1 INNER JOIN seating_area sa1 ON sa1.id =          │           │         │       ║
║ s1.seating_area_id WHERE s1.seating_plan_id = $1              │           │         │       ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ SELECT extract(epoch from                                     │ 1         │ 647ms   │ 647ms ║
║ (c1.maximum_event_seating_lookup_duration)) FROM event e1     │           │         │       ║
║ INNER JOIN venue v1 ON v1.id = e1.venue_id INNER JOIN cinema  │           │         │       ║
║ c1 ON c1.id = v1.cinema_id WHERE e1.id = $1                   │           │         │       ║
╟───────────────────────────────────────────────────────────────┼───────────┼─────────┼───────╢
║ SELECT id FROM cinema_foreign_seat_type WHERE cinema_id = $1  │ 133       │ 150ms   │ 19.9s ║
║ AND fuid = $2                                                 │           │         │       ║
╚═══════════════════════════════════════════════════════════════╧═══════════╧═════════╧═══════╝

```

<a name="slonik-built-in-interceptors-benchmarking-interceptor-api-3"></a>
#### API

```js
import {
  createBenchmarkingInterceptor
} from 'slonik';

```

```js
() => InterceptorType;

```


<a name="slonik-recipes"></a>
## Recipes

<a name="slonik-recipes-inserting-large-number-of-rows"></a>
### Inserting large number of rows

Slonik provides [`sql.tupleList`](#sqltuplelist) helper function to generate a list of tuples that can be used in the `INSERT` values expression, e.g.

```js
await connection.query(sql`
  INSERT INTO (foo, bar, baz)
  VALUES ${sql.tupleList([
    [1, 2, 3],
    [4, 5, 6]
  ])}
`);

```

Produces:

```js
{
  sql: 'INSERT INTO (foo, bar, baz) VALUES ($1, $2, $3), ($4, $5, $6)',
  values: [
    1,
    2,
    3,
    4,
    5,
    6
  ]
}

```

There are 2 downsides to this approach:

1. The generated SQL is dynamic and will vary depending on the input.
  * You will not be able to track query stats.
  * Query parsing time increases with the query size.
2. There is a maximum number of parameters that can be bound to the statement (65535).

As an alternative, we can use [`sql.unnest`](#sqlunnest) to create a set of rows using `unnset`. Using the `unnset` approach requires only 1 variable per every column; values for each column are passed as an array, e.g.

```js
await connection.query(sql`
  INSERT INTO (foo, bar, baz)
  SELECT *
  FROM ${sql.unnest(
    [
      [1, 2, 3],
      [4, 5, 6]
    ],
    [
      'integer',
      'integer',
      'integer'
    ]
  )}
`);

```

Produces:

```js
{
  sql: 'INSERT INTO (foo, bar, baz) SELECT * FROM unnest($1::integer[], $2::integer[], $2::integer[])',
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

<a name="slonik-recipes-logging-auto_explain"></a>
### Logging <code>auto_explain</code>

`executionTime` log property describes how long it took for the client to execute the query, i.e. it includes the overhead of waiting for a connection and the network latency, among other things. However, it is possible to get the real query execution time by using [`auto_explain` module](https://www.postgresql.org/docs/current/auto-explain.html).

There are several pre-requisites:

```sql
-- Load the extension.
LOAD 'auto_explain';
-- or (if you are using AWS RDS):
LOAD '$libdir/plugins/auto_explain';

-- Enable logging of all queries.
SET auto_explain.log_analyze=true;
SET auto_explain.log_format=json;
SET auto_explain.log_min_duration=0;
SET auto_explain.log_timing=true;

-- Enables Slonik to capture auto_explain logs.
SET client_min_messages=log;

```

This can be configured using `afterPoolConnection` interceptor, e.g.



```js
const pool = await createPool('postgres://localhost', {
  interceptors: [
    {
      afterPoolConnection: async (connection) => {
        await connection.query(sql`LOAD 'auto_explain'`);
        await connection.query(sql`SET auto_explain.log_analyze=true`);
        await connection.query(sql`SET auto_explain.log_format=json`);
        await connection.query(sql`SET auto_explain.log_min_duration=0`);
        await connection.query(sql`SET auto_explain.log_timing=true`);
        await connection.query(sql`SET client_min_messages=log`);
      }
    }
  ]
});

```

Slonik recognises and parses the `auto_explain` JSON message; Roarr logger will produce a pretty-print of the explain output, e.g.

```yaml
[2018-12-31T21:15:21.010Z] INFO (30) (@slonik): notice message
notice:
  level:   notice
  message:
    Query Text: SELECT count(*) FROM actor
    Plan:
      Node Type:           Aggregate
      Strategy:            Plain
      Partial Mode:        Simple
      Parallel Aware:      false
      Startup Cost:        4051.33
      Total Cost:          4051.34
      Plan Rows:           1
      Plan Width:          8
      Actual Startup Time: 26.791
      Actual Total Time:   26.791
      Actual Rows:         1
      Actual Loops:        1
      Plans:
        -
          Node Type:           Seq Scan
          Parent Relationship: Outer
          Parallel Aware:      false
          Relation Name:       actor
          Alias:               actor
          Startup Cost:        0
          Total Cost:          3561.86
          Plan Rows:           195786
          Plan Width:          0
          Actual Startup Time: 0.132
          Actual Total Time:   15.29
          Actual Rows:         195786
          Actual Loops:        1

```

<a name="slonik-recipes-using-sql-raw-to-generate-dynamic-queries"></a>
### Using <code>sql.raw</code> to generate dynamic queries

[`sql.raw`](#sqlraw) can be used to generate fragments of an arbitrary SQL that are interpolated into the main query, e.g.

```js
const uniquePairs = [
  ['a', 1],
  ['b', 2]
];

let placeholderIndex = 1;

const whereConditionSql = uniquePairs
  .map(() => {
    return needleColumns
      .map((column) => {
        return column + ' = $' + placeholderIndex++;
      })
      .join(' AND ');
  })
  .join(' OR ');

const values = [];

for (const pairValues of uniquePairs) {
  values.push(...pairValues);
}

const query = sql`
  SELECT
    id
  FROM foo
  WHERE
    ${sql.raw(whereConditionSql, values)}
`;

await connection.any(query);

```

In the above example, `query` is:

```js
{
  sql: 'SELECT id FROM foo WHERE (a = $1 AND b = $2) OR (a = $3 AND b = $4)',
  values: [
    'a',
    1,
    'b',
    2
  ]
}

```

Multiple `sql.raw` fragments can be used to create a query.


<a name="slonik-conventions"></a>
## Conventions

<a name="slonik-conventions-no-multiline-values"></a>
### No multiline values

Slonik will strip all comments and line-breaks from a query before processing it.

This makes logging of the queries easier.

The implication is that your query cannot contain values that include a newline character, e.g.

```js
// Do not do this
connection.query(sql`INSERT INTO foo (bar) VALUES ('\n')`);

```

If you want to communicate a value that includes a multiline character, use value placeholder interpolation, e.g.

```js
connection.query(sql`INSERT INTO foo (bar) VALUES (${'\n'})`);

```

<a name="slonik-value-placeholders"></a>
## Value placeholders

<a name="slonik-value-placeholders-tagged-template-literals"></a>
### Tagged template literals

Slonik query methods can only be executed using `sql` [tagged template literal](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals), e.g.

```js
import {
  sql
} from 'slonik'

connection.query(sql`
  SELECT 1
  FROM foo
  WHERE bar = ${'baz'}
`);

```

The above is equivalent to evaluating:

```sql
SELECT 1
FROM foo
WHERE bar = $1

```

query with 'baz' value binding.

<a name="slonik-value-placeholders-sql-valuelist"></a>
### <code>sql.valueList</code>

```js
(values: $ReadOnlyArray<PrimitiveValueExpressionType>) => ValueListSqlTokenType;

```

Creates a list of values, e.g.

```js
await connection.query(sql`
  SELECT (${sql.valueList([1, 2, 3])})
`);

```

Produces:

```js
{
  sql: 'SELECT ($1, $2, $3)',
  values: [
    1,
    2,
    3
  ]
}

```

<a name="slonik-value-placeholders-sql-tuple"></a>
### <code>sql.tuple</code>

```js
(values: $ReadOnlyArray<PrimitiveValueExpressionType>) => TupleSqlTokenType;

```

Creates a tuple (typed row construct), e.g.

```js
await connection.query(sql`
  INSERT INTO (foo, bar, baz)
  VALUES ${sql.tuple([1, 2, 3])}
`);

```

Produces:

```js
{
  sql: 'INSERT INTO (foo, bar, baz) VALUES ($1, $2, $3)',
  values: [
    1,
    2,
    3
  ]
}

```

<a name="slonik-value-placeholders-sql-tuplelist"></a>
### <code>sql.tupleList</code>

```js
(tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>) => TupleListSqlTokenType;

```

Creates a list of tuples (typed row constructs), e.g.

```js
await connection.query(sql`
  INSERT INTO (foo, bar, baz)
  VALUES ${sql.tupleList([
    [1, 2, 3],
    [4, 5, 6]
  ])}
`);

```

Produces:

```js
{
  sql: 'INSERT INTO (foo, bar, baz) VALUES ($1, $2, $3), ($4, $5, $6)',
  values: [
    1,
    2,
    3,
    4,
    5,
    6
  ]
}

```

<a name="slonik-value-placeholders-sql-unnset"></a>
### <code>sql.unnset</code>

```js
(
  tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
  columnTypes: $ReadOnlyArray<string>
): UnnestSqlTokenType;

```

Creates an `unnset` expressions, e.g.

```js
await connection.query(sql`
  SELECT bar, baz
  FROM ${sql.unnest(
    [
      [1, 'foo'],
      [2, 'bar']
    ],
    [
      'integer',
      'text'
    ]
  )} AS foo(bar, baz)
`);

```

Produces:

```js
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

<a name="slonik-value-placeholders-sql-identifier"></a>
### <code>sql.identifier</code>

```js
(names: $ReadOnlyArray<string>) => IdentifierTokenType;

```

[Delimited identifiers](https://www.postgresql.org/docs/current/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS) are created by enclosing an arbitrary sequence of characters in double-quotes ("). To create create a delimited identifier, create an `sql` tag function placeholder value using `sql.identifier`, e.g.

```js
sql`
  SELECT 1
  FROM ${sql.identifier(['bar', 'baz'])}
`;

```

Produces:

```js
{
  sql: 'SELECT 1 FROM "bar"."bar"',
  values: []
}

```

<a name="slonik-value-placeholders-sql-raw"></a>
### <code>sql.raw</code>

```js
(rawSql: string, values?: $ReadOnlyArray<PrimitiveValueExpressionType>) => RawSqlTokenType;

```

Raw/ dynamic SQL can be inlined using `sql.raw`, e.g.

```js
sql`
  SELECT 1
  FROM ${sql.raw('"bar"')}
`;

```

Produces:

```js
{
  sql: 'SELECT 1 FROM "bar"',
  values: []
}

```

The second parameter of the `sql.raw` can be used to bind values, e.g.

```js
sql`
  SELECT ${sql.raw('$1', [1])}
`;

```

Produces:

```js
{
  sql: 'SELECT $1',
  values: [
    1
  ]
}

```


<a name="slonik-query-methods"></a>
## Query methods

<a name="slonik-query-methods-any"></a>
### <code>any</code>

Returns result rows.

Example:

```js
const rows = await connection.any(sql`SELECT foo`);

```

`#any` is similar to `#query` except that it returns rows without fields information.

<a name="slonik-query-methods-anyfirst"></a>
### <code>anyFirst</code>

Returns value of the first column of every row in the result set.

* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```js
const fooValues = await connection.anyFirst(sql`SELECT foo`);

```

<a name="slonik-query-methods-insert"></a>
### <code>insert</code>

Used when inserting 1 row.

Example:

```js
const {
  insertId
} = await connection.insert(sql`INSERT INTO foo SET bar='baz'`);

```

The reason for using this method over `#query` is to leverage the strict types. `#insert` method result type is `InsertResultType`.

<a name="slonik-query-methods-many"></a>
### <code>many</code>

Returns result rows.

* Throws `NotFoundError` if query returns no rows.

Example:

```js
const rows = await connection.many(sql`SELECT foo`);

```

<a name="slonik-query-methods-manyfirst"></a>
### <code>manyFirst</code>

Returns value of the first column of every row in the result set.

* Throws `NotFoundError` if query returns no rows.
* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```js
const fooValues = await connection.many(sql`SELECT foo`);

```

<a name="slonik-query-methods-maybeone"></a>
### <code>maybeOne</code>

Selects the first row from the result.

* Returns `null` if row is not found.
* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```js
const row = await connection.maybeOne(sql`SELECT foo`);

// row.foo is the result of the `foo` column value of the first row.

```

<a name="slonik-query-methods-maybeonefirst"></a>
### <code>maybeOneFirst</code>

Returns value of the first column from the first row.

* Returns `null` if row is not found.
* Throws `DataIntegrityError` if query returns multiple rows.
* Throws `DataIntegrityError` if query returns multiple columns.

Example:

```js
const foo = await connection.maybeOneFirst(sql`SELECT foo`);

// foo is the result of the `foo` column value of the first row.

```

<a name="slonik-query-methods-one"></a>
### <code>one</code>

Selects the first row from the result.

* Throws `NotFoundError` if query returns no rows.
* Throws `DataIntegrityError` if query returns multiple rows.

Example:

```js
const row = await connection.one(sql`SELECT foo`);

// row.foo is the result of the `foo` column value of the first row.

```

> Note:
>
> I've been asked "What makes this different from [knex.js](http://knexjs.org/) `knex('foo').limit(1)`?".
> `knex('foo').limit(1)` simply generates "SELECT * FROM foo LIMIT 1" query.
> `knex` is a query builder; it does not assert the value of the result.
> Slonik `#one` adds assertions about the result of the query.

<a name="slonik-query-methods-onefirst"></a>
### <code>oneFirst</code>

Returns value of the first column from the first row.

* Throws `NotFoundError` if query returns no rows.
* Throws `DataIntegrityError` if query returns multiple rows.
* Throws `DataIntegrityError` if query returns multiple columns.

Example:

```js
const foo = await connection.oneFirst(sql`SELECT foo`);

// foo is the result of the `foo` column value of the first row.

```

<a name="slonik-query-methods-query"></a>
### <code>query</code>

API and the result shape are equivalent to [`pg#query`](https://github.com/brianc/node-postgres).

<a name="slonik-query-methods-transaction"></a>
### <code>transaction</code>

`transaction` method is used wrap execution of queries in `START TRANSACTION` and `COMMIT` or `ROLLBACK`. `COMMIT` is called if the transaction handler returns a promise that resolves; `ROLLBACK` is called otherwise.

`transaction` method can be used together with `createPool` method. When used to create a transaction from an instance of a pool, a new connection is allocated for the duration of the transaction.

```js
const result = await connection.transaction(async (transactionConnection) => {
  await transactionConnection.query(sql`INSERT INTO foo (bar) VALUES ('baz')`);
  await transactionConnection.query(sql`INSERT INTO qux (quux) VALUES ('quuz')`);

  return 'FOO';
});

result === 'FOO';

```


<a name="slonik-error-handling"></a>
## Error handling

All Slonik errors extend from `SlonikError`, i.e. You can catch Slonik specific errors using the following logic.

```js
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

<a name="slonik-error-handling-handling-notfounderror"></a>
### Handling <code>NotFoundError</code>

To handle the case where query returns less than one row, catch `NotFoundError` error.

```js
import {
  NotFoundError
} from 'slonik';

let row;

try {
  row = await connection.one(sql`SELECT foo`);
} catch (error) {
  if (!(error instanceof NotFoundError)) {
    throw error;
  }
}

if (row) {
  // row.foo is the result of the `foo` column value of the first row.
}

```

<a name="slonik-error-handling-handling-dataintegrityerror"></a>
### Handling <code>DataIntegrityError</code>

To handle the case where the data result does not match the expectations, catch `DataIntegrityError` error.

```js
import {
  NotFoundError
} from 'slonik';

let row;

try {
  row = await connection.one(sql`SELECT foo`);
} catch (error) {
  if (error instanceof DataIntegrityError) {
    console.error('There is more than one row matching the select criteria.');
  } else {
    throw error;
  }
}

```

<a name="slonik-error-handling-handling-notnullintegrityconstraintviolationerror"></a>
### Handling <code>NotNullIntegrityConstraintViolationError</code>

`NotNullIntegrityConstraintViolationError` is thrown when Postgres responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23502`) error.

<a name="slonik-error-handling-handling-foreignkeyintegrityconstraintviolationerror"></a>
### Handling <code>ForeignKeyIntegrityConstraintViolationError</code>

`ForeignKeyIntegrityConstraintViolationError` is thrown when Postgres responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23503`) error.

<a name="slonik-error-handling-handling-uniqueintegrityconstraintviolationerror"></a>
### Handling <code>UniqueIntegrityConstraintViolationError</code>

`UniqueIntegrityConstraintViolationError` is thrown when Postgres responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23505`) error.

<a name="slonik-error-handling-handling-checkintegrityconstraintviolationerror"></a>
### Handling <code>CheckIntegrityConstraintViolationError</code>

`CheckIntegrityConstraintViolationError` is thrown when Postgres responds with [`unique_violation`](https://www.postgresql.org/docs/9.4/static/errcodes-appendix.html) (`23514`) error.

<a name="slonik-types"></a>
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
} from 'slonik';

export default async (
  connection: DatabaseConnectionType,
  code: string
): Promise<number> => {
  const countryId = await connection.oneFirst(sql`
    SELECT id
    FROM country
    WHERE code = ${code}
  `);

  return countryId;
};

```


<a name="slonik-debugging"></a>
## Debugging

<a name="slonik-debugging-logging"></a>
### Logging

Slonik uses [roarr](https://github.com/gajus/roarr) to log queries.

To enable logging, define `ROARR_LOG=true` environment variable.

By default, Slonik logs the input query, query execution time and affected row count.

You can enable additional logging details by configuring the following environment variables.

```bash
# Logs query parameter values
export SLONIK_LOG_VALUES=true

```

<a name="slonik-debugging-log-stack-trace"></a>
### Log stack trace

`SLONIK_LOG_STACK_TRACE=1` will create a stack trace before invoking the query and include the stack trace in the logs, e.g.

```json
{"context":{"package":"slonik","namespace":"slonik","logLevel":20,"executionTime":"357 ms","queryId":"01CV2V5S4H57KCYFFBS0BJ8K7E","rowCount":1,"sql":"SELECT schedule_cinema_data_task();","stackTrace":["/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist:162:28","/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist:314:12","/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist:361:20","/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist/utilities:17:13","/Users/gajus/Documents/dev/applaudience/data-management-program/src/bin/commands/do-cinema-data-tasks.js:59:21","/Users/gajus/Documents/dev/applaudience/data-management-program/src/bin/commands/do-cinema-data-tasks.js:590:45","internal/process/next_tick.js:68:7"],"values":[]},"message":"query","sequence":4,"time":1540915127833,"version":"1.0.0"}
{"context":{"package":"slonik","namespace":"slonik","logLevel":20,"executionTime":"66 ms","queryId":"01CV2V5SGS0WHJX4GJN09Z3MTB","rowCount":1,"sql":"SELECT cinema_id \"cinemaId\", target_data \"targetData\" FROM cinema_data_task WHERE id = ?","stackTrace":["/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist:162:28","/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist:285:12","/Users/gajus/Documents/dev/applaudience/data-management-program/node_modules/slonik/dist/utilities:17:13","/Users/gajus/Documents/dev/applaudience/data-management-program/src/bin/commands/do-cinema-data-tasks.js:603:26","internal/process/next_tick.js:68:7"],"values":[17953947]},"message":"query","sequence":5,"time":1540915127902,"version":"1.0.0"}

```

Use [`@roarr/cli`](https://github.com/gajus/roarr-cli) to pretty-print the output.

![Log Roarr pretty-print output.](./.README/log-roarr-pretty-print-output.png)


<a name="slonik-syntax-highlighting"></a>
## Syntax highlighting

<a name="slonik-syntax-highlighting-atom"></a>
### Atom

Using [Atom](https://atom.io/) IDE you can leverage the [`language-babel`](https://github.com/gandm/language-babel) package in combination with the [`language-sql`](https://github.com/atom/language-sql) to enable highlighting of the SQL strings in the codebase.

![Syntax highlighting in Atom](./.README/atom-syntax-highlighting.png)

To enable highlighting, you need to:

1. Install `language-babel` and `language-sql` packages.
1. Configure `language-babel` "JavaScript Tagged Template Literal Grammar Extensions" setting to use `language-sql` to highlight template literals with `sql` tag (configuration value: `sql:source.sql`).
1. Use [`sql` helper to construct the queries](https://github.com/gajus/slonik#tagged-template-literals).

For more information, refer to the [JavaScript Tagged Template Literal Grammar Extensions](https://github.com/gandm/language-babel#javascript-tagged-template-literal-grammar-extensions) documentation of `language-babel` package.
