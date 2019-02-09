// @flow

import test from 'ava';
import sinon from 'sinon';
import log from '../../../helpers/Logger';
import query from '../../../../src/connectionMethods/query';

test('overrides results', async (t) => {
  const interceptors = [
    {
      afterQueryExecution: () => {
        return {
          command: 'SELECT',
          fields: [],
          oid: null,
          rowAsArray: false,
          rowCount: 1,
          rows: [
            {
              foo: 2
            }
          ]
        };
      }
    }
  ];

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

  const result = await query(
    log,
    connection,
    {
      interceptors
    },
    ''
  );

  t.true(stub.callCount === 1);

  t.deepEqual(result, {
    command: 'SELECT',
    fields: [],
    oid: null,
    rowAsArray: false,
    rowCount: 1,
    rows: [
      {
        foo: 2
      }
    ]
  });
});
