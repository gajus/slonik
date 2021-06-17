# Slonik

[![Travis build status](http://img.shields.io/travis/gajus/slonik/master.svg?style=flat-square)](https://travis-ci.com/gajus/slonik)
[![Coveralls](https://img.shields.io/coveralls/gajus/slonik.svg?style=flat-square)](https://coveralls.io/github/gajus/slonik)
[![NPM version](http://img.shields.io/npm/v/slonik.svg?style=flat-square)](https://www.npmjs.org/package/slonik)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A [battle-tested](#battle-tested) PostgreSQL client with strict types, detailed logging and assertions.

![Tailing Slonik logs](./.README/slonik-log-tailing.gif)

(The above GIF shows Slonik producing [query logs](https://github.com/gajus/slonik#logging). Slonik produces logs using [Roarr](https://github.com/gajus/roarr). Logs include stack trace of the actual query invocation location and values used to execute the query.)

## Hiring

> Contra are hiring a Lead PostgreSQL Database Engineer/DBA!
>
> [Contra](https://contra.com/) is a rapidly growing professional network for freelancers. They are making it easier for talent to be discovered and for companies to hire project-based talent. You will be their first dedicated Database Engineer/DBA > hire. Your role will be to establish best practices for the company, implement it, and (over time) build the data engineering team. It is an opportunity to solve a massively complex and interesting problem at an organization > that is defining the future of work. If you ever wanted to work on a rocketship, this is as close as it gets. :rocket:
>
> Check out their latest product video:
>
> https://www.youtube.com/watch?v=y2zns9j3OJQ
>
> The role:
> * Lead PostgreSQL Database Engineer/DBA
> * 100% remote
> * 130-160k + equity
>
> Details about the company, the role, the technology stack and interview process:
>
> https://weworkremotely.com/remote-jobs/contra-lead-database-engineer-dba
>
> Apply:
>
> https://contra-ambassadors.typeform.com/to/ChcKQbBz#source=slonik

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

* [Assertions and type safety](#repeating-code-patterns-and-type-safety).
* [Connection mocking](#mocking-slonik).
* [Safe connection handling](#protecting-against-unsafe-connection-handling).
* [Safe transaction handling](#protecting-against-unsafe-transaction-handling).
* [Safe value interpolation](#protecting-against-unsafe-value-interpolation).
* [Transaction nesting](#transaction-nesting).
* [Transaction retrying](#transaction-retrying)
* Detailed [logging](#slonik-debugging).
* [Asynchronous stack trace resolution](#capture-stack-trace).
* [Middlewares](#slonik-interceptors).
* [Mapped errors](#error-handling).
* [ESLint plugin](https://github.com/gajus/eslint-plugin-sql).

## Contents

{"gitdown": "contents"}

## About Slonik

{"gitdown": "include", "file": "./ABOUT_SLONIK.md"}

## Documentation

{"gitdown": "include", "file": "./USAGE.md"}

{"gitdown": "include", "file": "./TYPE_PARSERS.md"}

{"gitdown": "include", "file": "./INTERCEPTORS.md"}

{"gitdown": "include", "file": "./RECIPES.md"}

{"gitdown": "include", "file": "./SQL_TAG.md"}

{"gitdown": "include", "file": "./VALUE_PLACEHOLDERS.md"}

{"gitdown": "include", "file": "./QUERY_BUILDING.md"}

{"gitdown": "include", "file": "./QUERY_METHODS.md"}

{"gitdown": "include", "file": "./ERROR_HANDLING.md"}

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

The [`vscode-sql-template-literal` extension](https://marketplace.visualstudio.com/items?itemName=forbeslindesay.vscode-sql-template-literal) provides syntax highlighting for VS Code:
![Syntax highlighting in VS Code](./.README/vscode-syntax-highlighting.png)
