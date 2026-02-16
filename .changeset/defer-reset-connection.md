---
'@slonik/driver': minor
'slonik': minor
---

Add `deferResetConnection` option to run `resetConnection` (e.g. `DISCARD ALL`) in the background after release instead of blocking it. When enabled, the connection release resolves immediately while the reset runs asynchronously. The connection remains unavailable for reuse until the reset completes. If the deferred reset fails, the connection is destroyed.
