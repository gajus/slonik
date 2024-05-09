# slonik-dataloaders

[![NPM version](http://img.shields.io/npm/v/slonik-sql-tag-raw.svg?style=flat-square)](https://www.npmjs.org/package/slonik-sql-tag-raw)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

Utilities for creating [DataLoaders](https://github.com/graphql/dataloader) using [Slonik](https://github.com/gajus/slonik). These DataLoaders abstract away some of the complexity of working with cursor-style pagination when working with a SQL database, while still maintaining the flexibility that comes with writing raw SQL statements.

### `createNodeByIdLoaderClass`

Example usage:

```ts
const UserByIdLoader = createNodeByIdLoaderClass({
  query: sql.type(User)`
    SELECT
      *
    FROM user
  `,
});

const pool = createPool("postgresql://");
const loader = new UserByIdLoader(pool);
const user = await loader.load(99);
```

By default, the loader will look for an integer column named `id` to use as the key. You can specify a different column to use like this:

```ts
const UserByIdLoader = createNodeByIdLoaderClass({
  column: {
    name: 'unique_id',
    type: 'text',
  }
  query: sql.type(User)`
    SELECT
      *
    FROM user
  `,
});
```

### `createConnectionLoaderClass`

Example usage

```ts
const UserConnectionLoader = createConnectionLoaderClass<User>({
  query: sql.type(User)`
    SELECT
      *
    FROM user
  `,
});

const pool = createPool("postgresql://");
const loader = new UserByIdLoader(pool);
const connection = await loader.load({
  where: ({ firstName }) => sql.fragment`${firstName} = 'Susan'`,
  orderBy: ({ firstName }) => [[firstName, "ASC"]],
});
```

When calling `load`, you can include `where` and `orderBy` expression factories that will be used to generate each respective clause. These factory functions allow for type-safe loader usage and abstract away the actual table alias used inside the generated SQL query. Note that the column names passed to each factory reflect the type provided when creating the loader class (i.e. `User` in the example above); however, each column name is transformed using `columnNameTransformer` as described below.

Usage example with forward pagination:

```ts
const connection = await loader.load({
  orderBy: ({ firstName }) => [[firstName, "ASC"]],
  limit: first,
  cursor: after,
});
```

Usage example with backward pagination:

```ts
const connection = await loader.load({
  orderBy: ({ firstName }) => [[firstName, "ASC"]],
  limit: last,
  cursor: before,
  reverse: true,
});
```

#### Conditionally fetching edges and count based on requested fields

In addition to the standard `edges` and `pageInfo` fields, each connection returned by the loader also includes a `count` field. This field reflects the total number of results that _would_ be returned if no limit was applied. In order to fetch both the edges and the count, the loader makes two separate database queries. However, the loader can determine whether it needs to request only one or both of the queries by looking at the GraphQL fields that were actually requested. To do this, we pass in the `GraphQLResolveInfo` parameter provided to every GraphQL resolver:

```ts
const connection = await loader.load({
  orderBy: ({ firstName }) => [[firstName, "ASC"]],
  limit: first,
  cursor: after,
  info,
});
```

#### Working with edge fields

It's possible to request columns that will be exposed as fields on the edge type in your schema, as opposed to on the node type. These fields should be included in your query and the TypeScript type provided to the loader. The loader returns each row of the results as both the `edge` and the `node`, so all requested columns are available inside the resolvers for either type. Note: each requested column should be unique, so if there's a name conflict, you should use an appropriate alias. For example:

```ts
const UserConnectionLoader = createConnectionLoaderClass<
  User & { edgeCreatedAt }
>({
  query: sql.unsafe`
    SELECT
      user.id,
      user.name,
      user.created_at,
      friend.created_at edge_created_at
    FROM user
    INNER JOIN friend ON
      user.id = friend.user_id
  `,
});
```

In the example above, if the field on the Edge type in the schema is named `createdAt`, we just need to write a resolver for it and resolve the value to that of the `edgeCreatedAt` property.

### `columnNameTransformer`

Both types of loaders also accept an `columnNameTransformer` option. By default, the transformer used is [snake-case](https://www.npmjs.com/package/snake-case). The default assumes:

- You're using conventional snake case column names; and
- You're using either [`slonik-interceptor-field-name-transformation`](https://github.com/gajus/slonik-interceptor-field-name-transformation) or the [`slonik-interceptor-preset`](https://github.com/gajus/slonik-interceptor-preset), which means the columns are returned as camelCased in the query results

By using the `columnNameTransformer` (snake case), fields can be referenced by their names as they appear in the results when calling the loader, while still referencing the correct columns inside the query itself. If your usage doesn't meet the above two criteria, consider providing an alternative transformer, like an identify function.

## Acknowledgments

This library has been originally developed by @danielrearden (https://github.com/danielrearden/slonik-dataloaders), and it has been ported (with adjustments) with Daniel's permission to Slonik monorepo.