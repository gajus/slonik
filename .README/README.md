# Slonik

[![Travis build status](http://img.shields.io/travis/gajus/slonik/master.svg?style=flat-square)](https://travis-ci.org/gajus/slonik)
[![Coveralls](https://img.shields.io/coveralls/gajus/slonik.svg?style=flat-square)](https://coveralls.io/github/gajus/slonik)
[![NPM version](http://img.shields.io/npm/v/slonik.svg?style=flat-square)](https://www.npmjs.org/package/slonik)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A [battle-tested](#battle-tested) PostgreSQL client with strict types, detail logging and assertions.

![Tailing Slonik logs](./.README/slonik-log-tailing.gif)

## Principles

* Promotes writing raw SQL.
* Discourages ad-hoc dynamic generation of SQL.

Read: [Stop using Knex.js](https://medium.com/@gajus/bf410349856c)

Note: Using this project does not require TypeScript or Flow. It is a regular ES6 module. Ignore the type definitions used in the documentation if you do not use a type system.

## Features

* [Assertions and type safety](#repeating-code-patterns-and-type-safety)
* [Safe connection handling](#protecting-against-unsafe-connection-handling).
* [Safe transaction handling](#protecting-against-unsafe-transaction-handling).
* [Safe value interpolation](#protecting-against-unsafe-value-interpolation).
* [Transaction nesting](#transaction-nesting).
* Detail [logging](#slonik-debugging).
* [Asynchronous stack trace resolution](#log-stack-trace).
* [Middlewares](#slonik-interceptors).
* [Mapped errors](#error-handling).
* [Atom plugin](#slonik-syntax-highlighting).
* [ESLint plugin](https://github.com/gajus/eslint-plugin-sql).

## Contents

{"gitdown": "contents"}

## About Slonik

{"gitdown": "include", "file": "./ABOUT_SLONIK.md"}

## Documentation

{"gitdown": "include", "file": "./USAGE.md"}

{"gitdown": "include", "file": "./INTERCEPTORS.md"}

{"gitdown": "include", "file": "./RECIPES.md"}

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
