## `sql` tag

`sql` tag serves two purposes:

* It is used to construct queries with bound parameter values (see [Value placeholders](#value-placeholders)).
* It used to generate dynamic query fragments (see [Query building](#query-building)).

`sql` tag can be imported from Slonik package:

```js
import {
  sql
} from 'slonik';

```

Sometiems it may be desirable to construct a custom instance of `sql` tag (e.g. see a note in [`sql.assignmentList`](#slonik-query-building-sql-assignmentlist)). In those cases, you can use the `createSqlTag` factory, e.g.

```js
import {
  createSqlTag
} from 'slonik';

/**
 * Normalizes identifier name. Used when identifier's name is passed as a plain-text property name (see `sql.assignmentList`).
 * The default IdentifierNormalizer (defined in `./src/utilities/normalizeIdentifier.js` and exported as `normalizeIdentifier` from Slonik package)
 * converts string to snake_case.
 *
 * @typedef {Function} IdentifierNormalizer
 * @param {string} propertyName
 * @returns {string}
 */

/**
 * @typedef SqlTagConfiguration
 * @property {IdentifierNormalizer} [normalizeIdentifier]
 */

/**
 * @param {SqlTagConfiguration} configuration
 */
const sql = createSqlTag(configuration);

```
