---
"@slonik/driver": patch
---

fix: a connection that fails while it is reset after release (e.g. while it runs `DISCARD ALL`) is destroyed right away, instead of once `gracefulTerminationTimeout` elapses.
