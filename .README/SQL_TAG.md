## `sql` tag

`sql` tag serves two purposes:

* It is used to construct queries with bound parameter values (see [Value placeholders](#value-placeholders)).
* It used to generate dynamic query fragments (see [Query building](#query-building)).

`sql` tag can be imported from Slonik package:

```ts
import {
  sql
} from 'slonik';
```

Sometimes it may be desirable to construct a custom instance of `sql` tag. In those cases, you can use the `createSqlTag` factory, e.g.

```ts
import {
  createSqlTag
} from 'slonik';

const sql = createSqlTag();
```

### Typing `sql` tag

`sql` has a generic interface, meaning that you can supply it with the type that represents the expected result of the query, e.g.

```ts
type Person = {
  id: number,
  name: string,
};

const query = sql<Person>`
  SELECT id, name
  FROM person
`;

// onePerson has a type of Person
const onePerson = await connection.one(query);

// persons has a type of Person[]
const persons = await connection.many(query);
```

As you see, query helper methods (`one`, `many`, etc.) infer the result type based on the type associated with the `sql` tag instance.

However, you should avoid passing types directly to `sql` and instead use [runtime validation](#runtime-validation). Runtime validation produces typed `sql` tags, but also validates the results of the query.