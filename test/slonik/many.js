// @flow

/* eslint-disable flowtype/no-weak-types */

import test from 'ava';
import sinon from 'sinon';
import {
  many,
  NotFoundError
} from '../../src';

test('returns the query results rows', async (t) => {
  const stub = sinon.stub().returns({
    rows: [
      {
        foo: 1
      },
      {
        foo: 2
      }
    ]
  });

  const connection: any = {
    query: stub
  };

  const result = await many(connection, {}, '');

  t.deepEqual(result, [
    {
      foo: 1
    },
    {
      foo: 2
    }
  ]);
});

test('throws an error if no rows are returned', async (t) => {
  const stub = sinon.stub().returns({
    rows: []
  });

  const connection: any = {
    query: stub
  };

  await t.throwsAsync(many(connection, {}, ''), NotFoundError);
});
