## Value placeholders

Slonik enables use of question mark (`?`) value placeholders, e.g.

```js
await connection.query('SELECT ?', [
  1
]);

```

Question mark value placeholders are converted to positional value placeholders before they are passed to the `pg` driver, i.e. the above query becomes:

```sql
SELECT $1
```

> Do not mix question mark and positional value placeholders in a single query.

### A value set

A question mark is interpolated into a value set when the associated value is an array, e.g.

```js
await connection.query('SELECT ?', [
  [
    1,
    2,
    3
  ]
]);

```

Produces:

```sql
SELECT ($1, $2, $3)

```

### Multiple value sets

A question mark is interpolated into a list of value sets when the associated value is an array of arrays, e.g.

```js
await connection.query('SELECT ?', [
  [
    [
      1,
      2,
      3
    ],
    [
      1,
      2,
      3
    ]
  ]
]);

```

Produces:

```sql
SELECT ($1, $2, $3), ($4, $5, $6)

```

### Named placeholders

A `:[a-zA-Z]` regex is used to match named placeholders.

```js
await connection.query('SELECT :foo', {
  foo: 'FOO'
});

```

Produces:

```sql
SELECT $1

```

### Tagged template literals

Query methods can be executed using `sql` [tagged template literal](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals), e.g.

```js
import {
  sql
} from 'slonik'

connection.query(sql`INSERT INTO reservation_ticket (reservation_id, ticket_id) VALUES ${values}`);

```

Arguments of a tagged template literal invocation are replaced with an anonymous value placeholder, i.e. the latter query is equivalent to:

```js
connection.query('INSERT INTO reservation_ticket (reservation_id, ticket_id) VALUES ?', [
  values
]);

```

#### Guarding against accidental unescaped input

When using tagged template literals, it is easy to forget to add the `sql` tag, i.e.

Instead of:

```js
connection.query(sql`INSERT INTO reservation_ticket (reservation_id, ticket_id) VALUES ${values}`);

```

Writing

```js
connection.query(`INSERT INTO reservation_ticket (reservation_id, ticket_id) VALUES ${values}`);

```

This would expose your application to [SQL injection](https://en.wikipedia.org/wiki/SQL_injection).

Therefore, I recommend using [`eslint-plugin-sql`](https://github.com/gajus/eslint-plugin-sql) `no-unsafe-query` rule. `no-unsafe-query` warns about use of SQL inside of template literals without the `sql` tag.
