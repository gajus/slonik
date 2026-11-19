---
"slonik": patch
---

fix: the pool no longer exceeds `maxPoolSize` when it replaces a destroyed connection to keep `minPoolSize` connections while another connection is being established.
