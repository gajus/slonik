import test from 'ava';
import {
  createTypeOverrides,
} from '../../../src/routines/createTypeOverrides';

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
    release: () => {},
  } as any;

  const pool = {
    connect: () => {
      return connection;
    },
  } as any;

  const typeParser = {
    name: 'int8',

    parse: () => {
      return 'our-int8';
    },
  };

  const typeOverrides = await createTypeOverrides(pool, [
    typeParser,
  ]) as any;

  t.is(typeOverrides('foo')('qux'), 'our-int8');
  t.deepEqual(typeOverrides('bar')('{qux}'), [
    'our-int8',
  ]);
});

test('throws an error if type cannot be found', async (t) => {
  const connection = {
    query: () => {
      return {
        rows: [],
      };
    },
    release: () => {},
  } as any;

  const pool = {
    connect: () => {
      return connection;
    },
  } as any;

  const typeParser = {
    name: 'int8',

    parse: () => {
      return null;
    },
  };

  const error = await t.throwsAsync(createTypeOverrides(pool, [
    typeParser,
  ]));

  t.is(error?.message, 'Database type "int8" not found.');
});
