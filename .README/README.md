# Slonik

[![NPM version](http://img.shields.io/npm/v/slonik.svg?style=flat-square)](https://www.npmjs.org/package/slonik)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A [battle-tested](#battle-tested) Node.js PostgreSQL client with strict types, detailed logging and assertions.

![Tailing Slonik logs](./.README/slonik-log-tailing.gif)

(The above GIF shows Slonik producing [query logs](https://github.com/gajus/slonik#logging). Slonik produces logs using [Roarr](https://github.com/gajus/roarr). Logs include stack trace of the actual query invocation location and values used to execute the query.)

## Sponsors

If you value my work and want to see Slonik and [many other of my](https://github.com/gajus/) Open-Source projects to be continuously improved, then please consider becoming a patron:

[![Buy Me A Coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/gajus)
[![Become a Patron](https://c5.patreon.com/external/logo/become_a_patron_button.png)](https://www.patreon.com/gajus)

## Principles

* Promotes writing raw SQL.
* Discourages ad-hoc dynamic generation of SQL.

Read: [Stop using Knex.js](https://medium.com/@gajus/bf410349856c)

Note: Using this project does not require TypeScript. It is a regular ES6 module. Ignore the type definitions used in the documentation if you do not use a type system.

## Features

* [Runtime validation](#runtime-validation)
* [Assertions and type safety](#repeating-code-patterns-and-type-safety).
* [Connection mocking](#mocking-slonik).
* [Safe connection handling](#protecting-against-unsafe-connection-handling).
* [Safe transaction handling](#protecting-against-unsafe-transaction-handling).
* [Safe value interpolation](#protecting-against-unsafe-value-interpolation).
* [Transaction nesting](#transaction-nesting).
* [Transaction retrying](#transaction-retrying)
* [Query retrying](#query-retrying)
* Detailed [logging](#slonik-debugging).
* [Asynchronous stack trace resolution](#capture-stack-trace).
* [Middlewares](#slonik-interceptors).
* [Mapped errors](#error-handling).
* [ESLint plugin](https://github.com/gajus/eslint-plugin-sql).

## Contents

{"gitdown": "contents"}

{"gitdown": "include", "file": "./ABOUT_SLONIK.md"}

## Documentation

{"gitdown": "include", "file": "./USAGE.md"}

{"gitdown": "include", "file": "./LIBRARY_COMPARISON.md"}

{"gitdown": "include", "file": "./TYPE_PARSERS.md"}

{"gitdown": "include", "file": "./INTERCEPTORS.md"}

{"gitdown": "include", "file": "./RECIPES.md"}

{"gitdown": "include", "file": "./RUNTIME_VALIDATION.md"}

{"gitdown": "include", "file": "./SQL_TAG.md"}

{"gitdown": "include", "file": "./VALUE_PLACEHOLDERS.md"}

{"gitdown": "include", "file": "./QUERY_BUILDING.md"}

{"gitdown": "include", "file": "./QUERY_METHODS.md"}

{"gitdown": "include", "file": "./UTILITIES.md"}

{"gitdown": "include", "file": "./ERROR_HANDLING.md"}

{"gitdown": "include", "file": "./MIGRATIONS.md"}

{"gitdown": "include", "file": "./TYPES.md"}

{"gitdown": "include", "file": "./DEBUGGING.md"}

## Syntax Highlighting

### Atom Syntax Highlighting Plugin

Using [Atom](https://atom.io/) IDE you can leverage the [`language-babel`](https://github.com/gandm/language-babel) package in combination with the [`language-sql`](https://github.com/atom/language-sql) to enable highlighting of the SQL strings in the codebase.

![Syntax highlighting in Atom](./.README/atom-syntax-highlighting.png)

To enable highlighting, you need to:

1. Install `language-babel` and `language-sql` packages.
1. Configure `language-babel` "JavaScript Tagged Template Literal Grammar Extensions" setting to use `language-sql` to highlight template literals with `sql` tag (configuration value: `sql:source.sql`).
1. Use [`sql` helper to construct the queries](https://github.com/gajus/slonik#tagged-template-literals).

For more information, refer to the [JavaScript Tagged Template Literal Grammar Extensions](https://github.com/gandm/language-babel#javascript-tagged-template-literal-grammar-extensions) documentation of `language-babel` package.

### VS Code Syntax Highlighting Extension

The [`vscode-sql-lit` extension](https://marketplace.visualstudio.com/items?itemName=thebearingedge.vscode-sql-lit) provides syntax highlighting for VS Code:
![Syntax highlighting in VS Code](./.README/vscode-syntax-highlighting.png)

## Development

Running Slonik tests requires having a local PostgreSQL instance.

The easiest way to setup a temporary instance for testing is using Docker, e.g.

```bash
docker run --name slonik-test --rm -it -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 postgres -N 1000
```
