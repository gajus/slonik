// @flow

import test from 'ava';
import sinon from 'sinon';
import log from '../../helpers/Logger';
import createClientConfiguration from '../../helpers/createClientConfiguration';
import maybeOne from '../../../src/connectionMethods/maybeOne';
import {
  DataIntegrityError
} from '../../../src/errors';

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

  const result = await maybeOne(log, connection, createClientConfiguration(), '');

  t.deepEqual(result, {
    foo: 1
  });
});

test('returns null if no results', async (t) => {
  const stub = sinon.stub().returns({
    rows: []
  });

  const connection: any = {
    query: stub
  };

  const result = await maybeOne(log, connection, createClientConfiguration(), '');

  t.true(result === null);
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

  await t.throwsAsync(maybeOne(log, connection, createClientConfiguration(), ''), DataIntegrityError);
});
