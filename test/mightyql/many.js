// @flow

/* eslint-disable flowtype/no-weak-types */

import test from 'ava';
import sinon from 'sinon';
import ExtendableError from 'es6-error';
import {
  many,
  NotFoundError
} from '../../src';

class TestError extends ExtendableError {}

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

  const result = await many(connection, {}, 'SELECT foo FROM bar');

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

  await t.throws(many(connection, {}, 'SELECT foo FROM bar'), NotFoundError);
});

test('throws an error if no rows are returned (user defined error constructor)', async (t) => {
  const stub = sinon.stub().returns({
    rows: []
  });

  const connection: any = {
    query: stub
  };

  const clientConfiguration = {
    errors: {
      NotFoundError: TestError
    }
  };

  await t.throws(many(connection, clientConfiguration, 'SELECT foo FROM bar'), TestError);
});
