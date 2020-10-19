// @flow

import test from 'ava';
import createTypeOverrides from '../../../src/routines/createTypeOverrides';

test('uses typname to retrieve pg_type oid', async (t) => {
  const connection = {
    query: () => {
      return {
        rows: [
          {
            oid: 'foo',
            typarray: 'bar',
            typname: 'int8',
          },
        ],
      };
    },
  };

  const typeParser = {
    name: 'int8',

    parse: () => {
      return null;
    },
  };

  const typeOverrides = await createTypeOverrides(connection, [
    typeParser,
  ]);

  t.is(typeof typeOverrides.text.foo, 'function');
  t.is(typeof typeOverrides.text.bar, 'function');
});

test('throws an error if type cannot be found', async (t) => {
  const connection = {
    query: () => {
      return {
        rows: [],
      };
    },
  };

  const typeParser = {
    name: 'int8',

    parse: () => {
      return null;
    },
  };

  const error = await t.throwsAsync(createTypeOverrides(connection, [
    typeParser,
  ]));

  t.is(error.message, 'Database type "int8" not found.');
});
