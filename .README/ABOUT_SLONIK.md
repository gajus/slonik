### Battle-Tested

Slonik began as a collection of utilities designed for working with [`node-postgres`](https://github.com/brianc/node-postgres). We continue to use `node-postgres` as it provides a robust foundation for interacting with PostgreSQL. However, what once was a collection of utilities has since grown into a framework that abstracts repeating code patterns, protects against unsafe connection handling and value interpolation, and provides rich debugging experience.

Slonik has been [battle-tested](https://medium.com/@gajus/lessons-learned-scaling-postgresql-database-to-1-2bn-records-month-edc5449b3067) with large data volumes and queries ranging from simple CRUD operations to data-warehousing needs.

### Origin of the name

![Slonik](./.README/postgresql-elephant.png)

The name of the elephant depicted in the official PostgreSQL logo is Slonik. The name itself is derived from the Russian word for "little elephant".

Read: [The History of Slonik, the PostgreSQL Elephant Logo](https://www.vertabelo.com/blog/notes-from-the-lab/the-history-of-slonik-the-postgresql-elephant-logo)

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

This becomes particularly important when writing routines where multiple queries depend on the previous result. Using methods with inbuilt assertions ensure that in case of an error, the error points to the original source of the problem. In contrast, unless assertions for all possible outcomes are typed out as in the previous example, the unexpected result of the query will be fed to the next operation. If you are lucky, the next operation will simply break; if you are unlucky, you are risking data corruption and hard to locate bugs.

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

The above example will throw an error as the `fooId` is guaranteed to be an array and last query binding is expecting a primitive value.
