// @flow

import test from 'ava';
import setupTypeParsers from '../../../src/routines/setupTypeParsers';

test('uses typname to retrieve pg_type oid and binds connection types', async (t) => {
  const connection = {
    query: () => {
      return {
        rows: [
          {
            oid: 'foo',
            typarray: 'bar',
            typname: 'int8'
          }
        ]
      };
    }
  };

  const typeParser = {
    name: 'int8',

    // eslint-disable-next-line no-unused-vars
    parse: (value) => {
      return null;
    }
  };

  await setupTypeParsers(connection, [
    typeParser
  ]);

  // $FlowFixMe
  t.assert(typeof connection._types.text.foo === 'function');

  // $FlowFixMe
  t.assert(typeof connection._types.text.bar === 'function');
});

test('throws an error if type cannot be found', async (t) => {
  const connection = {
    query: () => {
      return {
        rows: []
      };
    }
  };

  const typeParser = {
    name: 'int8',

    // eslint-disable-next-line no-unused-vars
    parse: (value) => {
      return null;
    }
  };

  await t.throwsAsync(setupTypeParsers(connection, [
    typeParser
  ]), 'Database type "int8" not found.');
});
