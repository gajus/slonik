---
"slonik-interceptor-field-name-transformation": minor
---

improve `transformRow` performance: rows are copied by a function that is compiled once per set of fields into an object literal, instead of being assembled one property at a time on a null-prototype object (which V8 keeps in slower dictionary mode). Transforming 200,000 rows of 12 fields is ~25x faster, and reading fields of the transformed rows ~12x faster. Rows are now plain objects, and rows whose field names do not need to be transformed are returned as they are. Also fixes reusing the transformation of a different set of fields when field names contain commas, or when `test` depends on the field type.
