## Runtime validation

Slonik integrates [zod](https://github.com/colinhacks/zod) to provide runtime query result validation and static type inference.

Validating queries requires to:

1. Define a Zod [object](https://github.com/colinhacks/zod#objects) and passing it to `sql.type` tagged template (see below)
1. Add a [result parser interceptor](#result-parser-interceptor)

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
connection.any(sql.unsafe`
  SELECT id, name
  FROM person
`);
```

With your knowledge of the database schema, define a zod object:

```ts
const personObject = z.object({
  id: z.number(),
  name: z.string(),
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

Just to give an idea, in our sample of data, it takes sub 0.1ms to validate 1 row, ~3ms to validate 1,000 and ~25ms to validate 100,000 rows.

### Unknown keys

Slonik disallows unknown keys, i.e. query that returns `{foo: 'bar', baz: 'qux'}` with `z.object({foo: z.string()})` schema will produce `SchemaValidationError` error.

### Handling schema validation errors

If query produces a row that does not satisfy zod object, then `SchemaValidationError` error is thrown.

`SchemaValidationError` includes properties that describe the query and validation errors:

* `sql` – SQL of the query that produced unexpected row.
* `row` – row data that did not satisfy the schema.
* `issues` – array of unmet expectations.

Whenever this error occurs, the same information is also included in the [logs](#logging).

In most cases, you shouldn't attempt to handle these errors at individual query level – allow to propagate to the top of the application and fix the issue when you become aware of it.

However, in cases such as dealing with unstructured data, it might be useful to handle these errors at a query level, e.g.

```ts
import {
  SchemaValidationError
} from 'slonik';
try {
} catch (error) {
  if (error instanceof SchemaValidationError) {
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
// from sql tagged template `parser` property
type Person = z.infer<
  personQuery.parser
>;
```

### Transforming results

Using zod [transform](https://github.com/colinhacks/zod#transform) you can refine the result shape and its type, e.g.

```ts
const coordinatesType = z.string().transform((subject) => {
  const [
    x,
    y,
  ] = subject.split(',');

  return {
    x: Number(x),
    y: Number(y),
  };
});

const zodObject = z.object({
  foo: coordinatesType,
});

const query = sql.type(zodObject)`SELECT '1,2' as foo`;

const result = await pool.one(query);

expectTypeOf(result).toMatchTypeOf<{foo: {x: number, y: number, }, }>();

t.deepEqual(result, {
  foo: {
    x: 1,
    y: 2,
  },
});
```

### Result parser interceptor

Slonik works without the interceptor, but it doesn't validate the query results. To validate results, you must implement an interceptor that parses the results.

For context, when Zod parsing was first introduced to Slonik, it was enabled for all queries by default. However, I eventually realized that the baked-in implementation is not going to suit everyone's needs. For this reason, I decided to take out the built-in interceptor in favor of providing examples for common use cases. What follows is the original default implementation.

```ts
import {
  type Interceptor,
  type QueryResultRow,
  SchemaValidationError,
} from 'slonik';

const createResultParserInterceptor = (): Interceptor => {
  return {
    // If you are not going to transform results using Zod, then you should use `afterQueryExecution` instead.
    // Future versions of Zod will provide a more efficient parser when parsing without transformations.
    // You can even combine the two – use `afterQueryExecution` to validate results, and (conditionally)
    // transform results as needed in `transformRow`.
    transformRow: (executionContext, actualQuery, row) => {
      const {
        log,
        resultParser,
      } = executionContext;

      if (!resultParser) {
        return row;
      }

      const validationResult = resultParser.safeParse(row);

      if (!validationResult.success) {
        throw new SchemaValidationError(
          actualQuery,
          row,
          validationResult.error.issues,
        );
      }

      return validationResult.data as QueryResultRow;
    },
  };
};
```

To use it, simply add it as a middleware:

```ts
import {
  createPool,
} from 'slonik';

createPool('postgresql://', {
  interceptors: [
    createResultParserInterceptor(),
  ]
});
```