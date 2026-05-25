---
"slonik": patch
---

Fixed connection pool leak when `release()` fails due to an in-flight query (fixes #660)
