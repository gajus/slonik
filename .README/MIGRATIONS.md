## Migrations

This library intentionally doesn't handle migrations, because a database client and migrations are conceptually distinct problems.

My personal preference is to use [Flyway](https://flywaydb.org/) – it is a robust solution that many DBAs are already familiar with.

The Slonik community has also shared their successes with these Node.js frameworks:

* [`node-pg-migrate`](https://github.com/salsita/node-pg-migrate)
* [`@slonik/migrator`](https://www.npmjs.com/package/@slonik/migrator)