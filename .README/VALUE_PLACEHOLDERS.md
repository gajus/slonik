## Value placeholders

### Tagged template literals

Slonik query methods can only be executed using `sql` [tagged template literal](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals), e.g.

```js
import {
  sql
} from 'slonik'

connection.query(sql`
  INSERT INTO reservation_ticket (reservation_id, ticket_id)
  VALUES ${values}
`);

```

### Set interpolation

Array expressions produce sets, e.g.

```js
await connection.query(sql`
  SELECT ${[1, 2, 3]}
`);

```

Produces:

```sql
SELECT ($1, $2, $3)

```

An array containing array expressions produce a collection of sets, e.g.

```js
await connection.query(sql`
  SELECT ${[
    [1, 2, 3],
    [1, 2, 3]
  ]}
`);

```

Produces:

```sql
SELECT ($1, $2, $3), ($4, $5, $6)

```

#### Creating dynamic delimited identifiers

[Delimited identifiers](https://www.postgresql.org/docs/current/static/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS) are created by enclosing an arbitrary sequence of characters in double-quotes ("). To create create a delimited identifier, create an `sql` tag function placeholder value using `sql.identifier`, e.g.

```js
sql`
  SELECT ${'foo'}
  FROM ${sql.identifier(['bar', 'baz'])}
`;

// {
//   sql: 'SELECT $1 FROM "bar"."baz"',
//   values: [
//     'foo'
//   ]
// }

```

#### Inlining dynamic/ raw SQL

Raw SQL can be inlined using `sql.raw`, e.g.

```js
sql`
  SELECT ${'foo'}
  FROM ${sql.raw('"bar"')}
`;

// {
//   sql: 'SELECT $1 FROM "bar"',
//   values: [
//     'foo'
//   ]
// }

```
