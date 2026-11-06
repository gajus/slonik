---
"@slonik/driver": patch
"slonik": patch
---

fix: the connections that the pool keeps open for `minPoolSize` are no longer closed and replaced after `idleTimeout`. Besides the pool, the driver closed every connection `idleTimeout` after it was released, regardless of `minPoolSize`, so the pool kept opening new connections to replace them. Now only the pool closes idle connections, and it keeps `minPoolSize` connections open.
