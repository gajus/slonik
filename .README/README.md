# Slonik

[![Travis build status](http://img.shields.io/travis/gajus/slonik/master.svg?style=flat-square)](https://travis-ci.org/gajus/slonik)
[![Coveralls](https://img.shields.io/coveralls/gajus/slonik.svg?style=flat-square)](https://coveralls.io/github/gajus/slonik)
[![NPM version](http://img.shields.io/npm/v/slonik.svg?style=flat-square)](https://www.npmjs.org/package/slonik)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A [battle-tested](#battled-tested) PostgreSQL client with strict types, detail logging and assertions.

## Features

* [Convenience methods](#slonik-query-methods) with built-in assertions.
* [Middleware](#slonik-interceptors) support.
* [SQL injection guarding](#slonik-value-placeholders-tagged-template-literals).
* [Set interpolation](#slonik-value-placeholders-sql-set).
* Detail [logging](#slonik-debugging).
* [Parsing and logging of the auto_explain logs](#logging-auto_explain).
* Built-in [asynchronous stack trace resolution](#log-stack-trace).
* [Safe connection pooling](#checking-out-a-client-from-the-connection-pool).
* [Flow types](#types).
* [Mapped errors](#error-handling).
* [Transactions](#slonik-query-methods-transaction).
* [Atom plugin](#slonik-syntax-highlighting).
* [ESLint plugin](https://github.com/gajus/eslint-plugin-sql).

---

## Documentation

{"gitdown": "contents"}

{"gitdown": "include", "file": "./USAGE.md"}

{"gitdown": "include", "file": "./INTERCEPTORS.md"}

{"gitdown": "include", "file": "./RECIPES.md"}

## Battle-Tested

Slonik began as a collection of utilities designed for working with [`node-postgres`](https://github.com/brianc/node-postgres). We continue to use `node-postgres` as it provides a robust foundation for interacting with PostgreSQL. However, what once was a collection of utilities has since grown into a framework that abstracts repeating code patterns, protects against unsafe connection handling and value interpolation, and provides rich debugging experience.

Slonik has been [battle-tested](https://medium.com/@gajus/lessons-learned-scaling-postgresql-database-to-1-2bn-records-month-edc5449b3067) with large data volumes and queries ranging from simple CRUD operations to data-warehousing needs.

## Origin of the name

![Slonik](./.README/postgresql-elephant.png)

The name of the elephant depicted in the official PostgreSQL logo is Slonik. The name itself is derived from the Russian word for "little elephant".

Read: [The History of Slonik, the PostgreSQL Elephant Logo](https://www.vertabelo.com/blog/notes-from-the-lab/the-history-of-slonik-the-postgresql-elephant-logo)

## Conventions

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

{"gitdown": "include", "file": "./VALUE_PLACEHOLDERS.md"}

{"gitdown": "include", "file": "./QUERY_METHODS.md"}

{"gitdown": "include", "file": "./ERROR_HANDLING.md"}

{"gitdown": "include", "file": "./DEBUGGING.md"}

## Syntax highlighting

### Atom

Using [Atom](https://atom.io/) IDE you can leverage the [`language-babel`](https://github.com/gandm/language-babel) package in combination with the [`language-sql`](https://github.com/atom/language-sql) to enable highlighting of the SQL strings in the codebase.

![Syntax highlighting in Atom](./.README/atom-syntax-highlighting.png)

To enable highlighting, you need to:

1. Install `language-babel` and `language-sql` packages.
1. Configure `language-babel` "JavaScript Tagged Template Literal Grammar Extensions" setting to use `language-sql` to highlight template literals with `sql` tag (configuration value: `sql:source.sql`).
1. Use [`sql` helper to construct the queries](https://github.com/gajus/slonik#tagged-template-literals).

For more information, refer to the [JavaScript Tagged Template Literal Grammar Extensions](https://github.com/gandm/language-babel#javascript-tagged-template-literal-grammar-extensions) documentation of `language-babel` package.
