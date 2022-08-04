## Runtime validation and static type inference

Slonik integrates [zod](https://github.com/colinhacks/zod) to provide runtime query result validation and static type inference.

Runtime validation is added by defining a zod [object](https://github.com/colinhacks/zod#objects) and passing it to `sql.type` tagged template.

### Motivation

Build-time type safety guarantees that your application will work as expected at the time of the build (assuming that the types are correct in the first place).

The problem is that once you deploy the application, the database schema might change independently of the codebase. This drift may result in your application behaving in unpredictable and potentially dangerous ways, e.g., imagine if table `product` changed `price` from `numeric` to `text`. Without runtime validation, this would cause a cascade of problems and potential database corruption. Even worse, without runtime checks, this could go unnoticed for a long time.

In contrast, by using runtime checks, you can ensure that the contract between your codebase and the database is always respected. If there is a breaking change, the application fails with a loud error that is easy to debug.

By using `zod`, we get the best of both worlds: type safety and runtime checks.

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

With your knowledge of the database schema, define a zod object:

```ts
const personObject = z.object({
  id: t.number,
  name: t.string,
});
```

Update your query to use `sql.type` tag and pass `personObject`:

```ts
const personQuery = sql.type(personObject)`
  SELECT id, name
  FROM person
`;
```

Finally, query the database using typed `sql` tagged template:

```ts
const persons = await connection.any(personQuery);
```

With this information, Slonik guarantees that every member of `persons` is an object that has properties `id` and `name`, which are a non-null `number` and a non-null `string` respectively.

### Performance penalty

In the context of the network overhead, validation accounts for a tiny amount of the total execution time.

Just to give an idea, in our sample of data, it takes ~3ms to validate 1,000 rows and ~25ms to validate 100,000 rows.

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