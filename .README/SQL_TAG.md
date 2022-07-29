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

Sometimes it may be desirable to construct a custom instance of `sql` tag. In those cases, you can use the `createSqlTag` factory, e.g.

```js
import {
  createSqlTag
} from 'slonik';

const sql = createSqlTag();

```
