// @flow

/* eslint-disable flowtype/no-weak-types */

import test from 'ava';
import sinon from 'sinon';
import {
  query
} from '../../src';

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

  const result = await query(connection, {}, '');

  t.deepEqual(result, {
    rows: [
      {
        foo: 1
      }
    ]
  });
});

test('does not execute the query if "beforeQuery" returns result', async (t) => {
  const interceptors = [
    {
      beforeQuery: () => {
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
      beforeQuery: () => {

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
