---
"slonik-interceptor-query-logging": patch
"@slonik/dataloaders": patch
"slonik-sql-tag-raw": patch
---

Declare `@types/node` where Node globals are used

`roarr@7.21.7` dropped the `/// <reference types="node" />` directive from its type declarations. These packages use `process` and `Buffer` but never declared `@types/node` themselves — they were picking up the Node globals transitively through `roarr`, so removing the directive broke their builds. Each now declares `@types/node` directly.
