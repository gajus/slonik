## Runtime validation and static type inference

Slonik integrates [zod](https://github.com/colinhacks/zod) to provide runtime query result validation and static type inference.

Runtime validation is added by defining a zod [object](https://github.com/colinhacks/zod#objects) and passing it to `sql.type` tagged template.

### Example use of `sql.type`

Let's assume that you have a PostgreSQL table `person`:

```sql
CREATE TABLE "public"."person" (
  "id" integer GENERATED ALWAYS AS IDENTITY,
  "name" text NOT NULL,
  PRIMARY KEY ("id")
);
```

and you want to retrieve all persons in the database, along with their `id` and `name`:

```ts
connection.any(sql`
  SELECT id, name
  FROM person
`);
```

With your knowledge of the database schema, you would define zod object:

```ts
const personObject = z.object({
  id: t.number,
  name: t.string,
});
```

Now update your query to use `sql.type` tag and pass `personObject`:

```ts
const personQuery = sql.type(personObject)`
  SELECT id, name
  FROM person
`;
```

Now query the database:

```ts
const persons = await connection.any(personQuery);
```

With this information, Slonik guarantees that every member of `persons` is an object that has properties `id` and `name`, which are a non-null `number` and a non-null `string` respectively.

### Unknown keys

Slonik disallows unknown keys, i.e. query that returns `{foo: 'bar', baz: 'qux'}` with `z.object({foo: z.string()})` schema will produce `SchemaValidationError` error.

### Handling schema validation errors

If query produces a row that does not satisfy zod object, then `SchemaValidationError` error is thrown.

`SchemaValidationError` includes properties that describe the query and validation errors:

* `sql` – SQL of the query that produced unexpected row.
* `row` – row data that did not satisfy the schema.
* `issues` – array of unmet expectations.

In most cases, you shouldn't attempt to handle these errors at individual query level – allow to propagate to the top of the application and fix the issue when you become aware of it.

However, in cases such as dealing with unstructured data, it might be useful to handle these errors at a query level, e.g.

```ts
import {
  SchemaValidationError
} from 'slonik';

try {

} catch (error) {
  if (error extends SchemaValidationError) {
    // Handle scheme validation error
  }
}
```

### Inferring types

You can infer the TypeScript type of the query result. There are couple of ways of doing it:

```ts
// Infer using z.infer<typeof yourSchema>
// https://github.com/colinhacks/zod#type-inference
type Person = z.infer<typeof personObject>;

// from sql tagged template `zodObject` property
type Person = z.infer<
  personQuery.zodObject
>;
```