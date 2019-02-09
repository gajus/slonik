// @flow

import test from 'ava';
import sinon from 'sinon';
import log from '../helpers/Logger';
import createClientConfiguration from '../helpers/createClientConfiguration';
import one from '../../src/connectionMethods/one';
import {
  DataIntegrityError,
  NotFoundError
} from '../../src/errors';

test('returns the first row', async (t) => {
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

  const result = await one(log, connection, createClientConfiguration(), '');

  t.deepEqual(result, {
    foo: 1
  });
});

test('throws an error if no rows are returned', async (t) => {
  const stub = sinon.stub().returns({
    rows: []
  });

  const connection: any = {
    query: stub
  };

  await t.throwsAsync(one(log, connection, createClientConfiguration(), ''), NotFoundError);
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

  await t.throwsAsync(one(log, connection, createClientConfiguration(), ''), DataIntegrityError);
});
