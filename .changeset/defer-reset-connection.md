---
'@slonik/driver': minor
---

Run `resetConnection` (e.g. `DISCARD ALL`) in the background after release instead of blocking it. The connection release now resolves immediately while the reset runs asynchronously. The connection remains in `PENDING_RELEASE` state and is unavailable for reuse until the reset completes. If the reset fails, the connection is destroyed.
