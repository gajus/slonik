// @flow

import test from 'ava';
import sinon from 'sinon';
import log from '../../../helpers/Logger';
import query from '../../../../src/connectionMethods/query';

test('short-circuits the query execution', async (t) => {
  const interceptors = [
    {
      beforeQueryExecution: () => {
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

  t.true(stub.callCount === 0);

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

test('executes query if "beforeQuery" does not return results', async (t) => {
  const interceptors = [
    {
      beforeQueryExecution: () => {

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
    rows: [
      {
        foo: 1
      }
    ]
  });
});
