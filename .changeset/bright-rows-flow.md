---
"slonik": minor
---

replace p-limit with p-queue for async row transformation and yield to the event loop during processing to prevent monopolization (fixes #751)
