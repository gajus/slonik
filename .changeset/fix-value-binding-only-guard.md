---
"slonik": patch
---

Fix the value-binding-only query guard for tagged queries

A query whose entire body is a single value binding (e.g.
`pool.query(sql.unsafe\`${'something'}\`)`) is meant to be rejected with
`InvalidInputError` ("Unexpected SQL input. Query cannot be empty. Found only
value binding."). Since the migration to Slonik's internal `$slonik_N`placeholders, the guard ran against the not-yet-converted SQL and compared it to`$1`, while the tag actually produces `$slonik_1` at that point — so the check
never fired for real tagged queries and they were forwarded to PostgreSQL
instead (where they fail with a less helpful syntax error).

The placeholder conversion now happens before the validation, so the guard
correctly detects value-only queries regardless of how they are constructed. The
existing test only exercised a hand-built `$1` token; a regression test that goes
through the tag has been added.
