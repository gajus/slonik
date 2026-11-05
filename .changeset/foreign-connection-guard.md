---
"slonik": minor
---

fix: `UnexpectedForeignConnectionError` is raised only while the transaction is open. Previously, async work that was started inside of a transaction (e.g. a deferred side effect, or a `commit` / `rollback` event listener) raised the error for any query that it ran on another connection, even after the transaction had ended. Add `runOutsideTransaction(routine)` to run queries on other connections while a transaction is open, e.g. `await runOutsideTransaction(() => pool.query(auditLogQuery))`.
