// @flow

/* eslint-disable flowtype/no-weak-types */

import test from 'ava';
import sinon from 'sinon';
import {
  insert
} from '../../src';

test('returns an object describing the new record', async (t) => {
  const stub = sinon.stub().returns([
    {
      id: 1
    }
  ]);

  const connection: any = {
    query: stub
  };

  const result = await insert(connection, 'INSERT foo SET bar=1');

  t.deepEqual(result, {
    insertId: 1
  });
});
