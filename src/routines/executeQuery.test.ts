import { type QuerySqlToken } from '..';
import { InvalidInputError } from '../errors';
import { createClientConfiguration } from '../helpers/createClientConfiguration';
import { createErrorWithCode } from '../helpers/createErrorWithCode';
import { poolClientStateMap } from '../state';
import { executeQuery } from './executeQuery';
import anyTest, { type TestFn } from 'ava';
import { Roarr } from 'roarr';
import * as sinon from 'sinon';

const test = anyTest as TestFn<any>;
const { beforeEach } = test;

const createConnectionStub = () => {
  return {
    connection: {
      slonik: {
        terminated: null,
      },
    },
    off() {},
    on() {},
  } as any;
};

beforeEach((t) => {
  t.context.logger = Roarr;
  t.context.connection = createConnectionStub();
  t.context.executionRoutine = () => {};

  poolClientStateMap.set(t.context.connection, {
    connectionId: '1',
    mock: true,
    poolId: '1',
    terminated: null,
    transactionDepth: null,
    transactionId: null,
  });
});

test('throws a descriptive error if query is empty', async (t) => {
  const error = await t.throwsAsync(async () => {
    return await executeQuery(
      t.context.logger,
      t.context.connection,
      createClientConfiguration(),
      {
        sql: '',
        values: [],
      } as unknown as QuerySqlToken,
      'foo',
      t.context.executionRoutine,
      false,
    );
  });

  t.true(error instanceof InvalidInputError);
  t.is(error?.message, 'Unexpected SQL input. Query cannot be empty.');
});

test('throws a descriptive error if the entire query is a value binding', async (t) => {
  const error = await t.throwsAsync(async () => {
    return await executeQuery(
      t.context.logger,
      t.context.connection,
      createClientConfiguration(),
      {
        sql: '$1',
        values: [],
      } as unknown as QuerySqlToken,
      'foo',
      t.context.executionRoutine,
      false,
    );
  });

  t.true(error instanceof InvalidInputError);
  t.is(
    error?.message,
    'Unexpected SQL input. Query cannot be empty. Found only value binding.',
  );
});

test('retries an implicit query that failed due to a transaction error', async (t) => {
  const executionRoutineStub = sinon.stub();

  executionRoutineStub
    .onFirstCall()
    .rejects(createErrorWithCode('40P01'))
    .onSecondCall()
    .resolves({
      command: 'SELECT',
      fields: [],
      notices: [],
      rowCount: 1,
      rows: [
        {
          foo: 1,
        },
      ],
    });

  const result = await executeQuery(
    t.context.logger,
    t.context.connection,
    createClientConfiguration(),
    {
      sql: 'SELECT 1 AS foo',
      values: [],
    } as unknown as QuerySqlToken,
    'foo',
    executionRoutineStub,
    false,
  );

  t.is(executionRoutineStub.callCount, 2);
  t.deepEqual(result, {
    command: 'SELECT',
    fields: [],
    notices: [],
    rowCount: 1,
    rows: [
      {
        foo: 1,
      },
    ],
  });
});

test('returns the thrown transaction error if the retry limit is reached', async (t) => {
  const executionRoutineStub = sinon.stub();

  executionRoutineStub
    .onFirstCall()
    .rejects(createErrorWithCode('40P01'))
    .onSecondCall()
    .rejects(createErrorWithCode('40P01'));

  const clientConfiguration = createClientConfiguration();

  const error: any = await t.throwsAsync(
    executeQuery(
      t.context.logger,
      t.context.connection,
      {
        ...clientConfiguration,
        queryRetryLimit: 1,
      },
      {
        sql: 'SELECT 1 AS foo',
        values: [],
      } as unknown as QuerySqlToken,
      'foo',
      executionRoutineStub,
      false,
    ),
  );

  t.is(executionRoutineStub.callCount, 2);
  t.true(error instanceof Error);
  t.is(error.code, '40P01');
});

test('transaction errors are not handled if the function was called by a transaction', async (t) => {
  const connection = createConnectionStub();

  poolClientStateMap.set(connection, {
    connectionId: '1',
    mock: true,
    poolId: '1',
    terminated: null,
    transactionDepth: null,
    transactionId: '1',
  });

  const executionRoutineStub = sinon.stub();

  executionRoutineStub.onFirstCall().rejects(createErrorWithCode('40P01'));

  const clientConfiguration = createClientConfiguration();

  const error: any = await t.throwsAsync(
    executeQuery(
      t.context.logger,
      connection,
      {
        ...clientConfiguration,
        queryRetryLimit: 1,
      },
      {
        sql: 'SELECT 1 AS foo',
        values: [],
      } as unknown as QuerySqlToken,
      'foo',
      executionRoutineStub,
      false,
    ),
  );

  t.is(executionRoutineStub.callCount, 1);
  t.true(error instanceof Error);
  t.is(error.code, '40P01');
});
