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

    // eslint-disable-next-line no-unused-vars
    parse: (value) => {
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

    // eslint-disable-next-line no-unused-vars
    parse: (value) => {
      return null;
    },
  };

  await t.throwsAsync(createTypeOverrides(connection, [
    typeParser,
  ]), 'Database type "int8" not found.');
});
