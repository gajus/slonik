// @flow

import test from 'ava';
import sinon from 'sinon';
import log from '../../../helpers/Logger';
import createClientConfiguration from '../../../helpers/createClientConfiguration';
import query from '../../../../src/connectionMethods/query';

test('executes the query and returns the result', async (t) => {
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

  const result = await query(log, connection, createClientConfiguration(), '');

  t.deepEqual(result, {
    rows: [
      {
        foo: 1
      }
    ]
  });
});
