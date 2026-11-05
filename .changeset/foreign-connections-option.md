---
"slonik": minor
---

add `foreignConnections` configuration (`"reject"` (default) or `"allow"`), which replaces `dangerouslyAllowForeignConnections`. `dangerouslyAllowForeignConnections: true` keeps working as a deprecated alias of `foreignConnections: "allow"`; `foreignConnections` takes precedence when both are provided.
