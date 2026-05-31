---
"@slonik/driver": minor
"slonik": minor
---

Add `maxPoolSize` and `minPoolSize` configuration options

`maximumPoolSize` and `minimumPoolSize` have been renamed to `maxPoolSize` and `minPoolSize`. The original options continue to work but are now deprecated and will be removed in a future major release. When both a new and a deprecated option are provided, the new option takes precedence.
