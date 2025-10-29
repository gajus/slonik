# slonik-interceptor-field-name-transformation

[![NPM version](https://img.shields.io/npm/v/slonik-interceptor-field-name-transformation.svg?style=flat-square)](https://www.npmjs.org/package/slonik-interceptor-field-name-transformation)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

Transforms [Slonik](https://github.com/gajus/slonik) query result field names into camelCase.

## Motivation

This interceptor removes the necessity to alias field names, e.g.

```ts
connection.any(sql`
  SELECT
    id,
    full_name "fullName"
  FROM person
`);
```

Field name transformation uses the `afterQuery` interceptor method to format field names.

## Installation

```bash
npm install slonik-interceptor-field-name-transformation
```

## Configuration

You can configure which fields should be transformed by providing a `test` function to `createFieldNameTransformationInterceptor`

```ts
/**
 * @property test Tests whether the field should be formatted.
 * All fields that pass this test will have their names converted to camelCase.
 */
type ConfigurationType = {
  test: (field: FieldType) => boolean;
};

(configuration: ConfigurationType) => InterceptorType;
```

## Example usage

```ts
import {
  createPool
} from 'slonik';
import {
  createFieldNameTransformationInterceptor
} from 'slonik-interceptor-field-name-transformation';

const interceptors = [
  createFieldNameTransformationInterceptor({
    test: (field) => {
      return field.name !== '__typename' && /^[\d_a-z]+$/u.test(field.name);
    },
  })
];

const connection = createPool('postgres://', {
  interceptors
});

connection.any(sql`
  SELECT
    id,
    full_name,
    __typename
  FROM person
`);

// [
//   {
//     id: 1,
//     fullName: 'John Doe',
//     __typename: 'person'
//   }
// ]
```
