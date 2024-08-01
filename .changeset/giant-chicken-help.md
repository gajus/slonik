---
"slonik": major
---

fix: close all connections in pool.end(). Previously a subset idleConnections would hang until idleTimeout was reached
