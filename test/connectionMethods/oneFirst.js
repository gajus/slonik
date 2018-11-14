// @flow

/* eslint-disable flowtype/no-weak-types */

import test from 'ava';
import sinon from 'sinon';
import oneFirst from '../../src/connectionMethods/oneFirst';
import {
  DataIntegrityError,
  NotFoundError
} from '../../src/errors';

test('returns value of the first column from the first row', async (t) => {
  const stub = sinon.stub().returns({
    rows: [
      {
        foo: 1
      }
    ]
  });

  const connection: any = {
    query: stub
  };

  const result = await oneFirst(connection, {}, '');

  t.deepEqual(result, 1);
});

test('throws an error if no rows are returned', async (t) => {
  const stub = sinon.stub().returns({
    rows: []
  });

  const connection: any = {
    query: stub
  };

  await t.throwsAsync(oneFirst(connection, {}, ''), NotFoundError);
});

test('throws an error if more than one row is returned', async (t) => {
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

  await t.throwsAsync(oneFirst(connection, {}, ''), DataIntegrityError);
});

test('throws an error if more than one column is returned', async (t) => {
  const stub = sinon.stub().returns({
    rows: [
      {
        bar: 1,
        foo: 1
      }
    ]
  });

  const connection: any = {
    query: stub
  };

  await t.throwsAsync(oneFirst(connection, {}, ''), DataIntegrityError);
});
