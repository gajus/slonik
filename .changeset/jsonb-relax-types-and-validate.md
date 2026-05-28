---
"@slonik/sql-tag": minor
"@slonik/types": minor
---

feat: relax `SerializableValue` and validate `sql.jsonb` / `sql.json` payloads

- `SerializableValue` now accepts `Record<string, unknown>` and `unknown[]` for its
  recursive branches, so payloads from `JSON.parse`, external APIs, or generic
  event types no longer require a cast when passed to `sql.jsonb` / `sql.json`.
- Payloads are now walked for characters PostgreSQL rejects in `jsonb`/`json`
  values (null byte U+0000 and unpaired UTF-16 surrogates). A
  descriptive `InvalidInputError` is thrown with the JSON path of the
  offending value (e.g. `$.foo.bar[1]`) instead of letting PostgreSQL fail
  the query with a generic error.
- When `JSON.stringify` of a payload fails (e.g. `BigInt`), the resulting
  `InvalidInputError` now includes the underlying reason and attaches the
  original error as `cause`.
