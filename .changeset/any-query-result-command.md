---
"@slonik/driver": minor
"slonik": minor
---

fix: the type of `QueryResult.command` (and of `DriverCommand`) now includes every command that Postgres reports, e.g. `MERGE`, `SET` and `CREATE` (for `CREATE TABLE`), not only `COPY`, `DELETE`, `INSERT`, `SELECT` and `UPDATE`. The command is `null` if the query has no statement (e.g. it consists only of a comment), which was already the case at runtime. Code that handles the commands exhaustively, or that uses the command without checking for `null`, may need to be updated.
