# Slonik

[![Travis build status](http://img.shields.io/travis/gajus/slonik/master.svg?style=flat-square)](https://travis-ci.org/gajus/slonik)
[![Coveralls](https://img.shields.io/coveralls/gajus/slonik.svg?style=flat-square)](https://coveralls.io/github/gajus/slonik)
[![NPM version](http://img.shields.io/npm/v/slonik.svg?style=flat-square)](https://www.npmjs.org/package/slonik)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A PostgreSQL client with strict types, detail logging and assertions.

## Features

* [Convenience methods](#slonik-query-methods) with built-in assertions
* Anonymous, named and tagged template literal [value placeholders](#slonik-value-placeholders)
* [Middleware](#slonik-interceptors) support
* [Syntax highlighting](#slonik-syntax-highlighting) (Atom plugin compatible with Slonik)
* [SQL injection guarding](https://github.com/gajus/eslint-plugin-sql) (ESLint plugin compatible with Slonik)
* Detail [logging](#slonik-debugging)
* [Parsing and logging of the auto_explain logs.](#logging-auto_explain)
* Built-in [asynchronous stack trace resolution](#log-stack-trace)
* [Flow types](#types)
* [Mapped errors](#error-handling)
* [Transactions](#transactions)

---

## Documentation

{"gitdown": "contents"}

{"gitdown": "include", "file": "./USAGE.md"}

{"gitdown": "include", "file": "./INTERCEPTORS.md"}

{"gitdown": "include", "file": "./RECIPES.md"}

## Non-standard behaviour

* `timestamp` and `timestamp with time zone` returns UNIX timestamp in milliseconds.

## Conventions

### No multiline values

Slonik will strip all comments and line-breaks from a query before processing it.

This makes logging of the queries easier.

The implication is that your query cannot contain values that include a newline character, e.g.

```sql
// Do not do this
connection.query(sql`INSERT INTO foo (bar) VALUES ('\n')`);

```

If you want to communicate a value that includes a multiline character, use value placeholder interpolation, e.g.

```sql
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
