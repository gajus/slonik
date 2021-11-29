import anyTest from 'ava';
import type {
  TestFn,
} from 'ava';
import {
  Roarr,
} from 'roarr';
import * as sinon from 'sinon';
import {
  InvalidInputError,
} from '../../../src/errors';
import {
  executeQuery,
} from '../../../src/routines/executeQuery';
import {
  createClientConfiguration,
} from '../../helpers/createClientConfiguration';
import {
  createErrorWithCode,
} from '../../helpers/createErrorWithCode';

const test = anyTest as TestFn<any>;
const {beforeEach} = test;

const createConnectionStub = () => {
  return {
    connection: {
      slonik: {
        terminated: null,
      },
    },
    off () {},
    on () {},
  };
};

beforeEach((t) => {
  t.context.logger = Roarr;
  t.context.connection = createConnectionStub();
  t.context.executionRoutine = () => {};
});

test('throws a descriptive error if query is empty', async (t) => {
  const error = await t.throwsAsync(() => {
    return executeQuery(
      t.context.logger,
      t.context.connection,
      createClientConfiguration(),
      '',
      [],
      'foo',
      t.context.executionRoutine,
    );
  });

  t.true(error instanceof InvalidInputError);
  t.is(error?.message, 'Unexpected SQL input. Query cannot be empty.');
});

test('throws a descriptive error if the entire query is a value binding', async (t) => {
  const error = await t.throwsAsync(() => {
    return executeQuery(
      t.context.logger,
      t.context.connection,
      createClientConfiguration(),
      '$1',
      [],
      'foo',
      t.context.executionRoutine,
    );
  });

  t.true(error instanceof InvalidInputError);
  t.is(error?.message, 'Unexpected SQL input. Query cannot be empty. Found only value binding.');
});

test('retries an implicit query that failed due to a transaction error', async (t) => {
  const executionRoutineStub = sinon.stub();

  executionRoutineStub.onFirstCall()
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
    'SELECT 1 AS foo',
    [],
    'foo',
    executionRoutineStub,
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

  executionRoutineStub.onFirstCall()
    .rejects(createErrorWithCode('40P01'))
    .onSecondCall()
    .rejects(createErrorWithCode('40P01'));

  const clientConfiguration = createClientConfiguration();

  const error: any = await t.throwsAsync(executeQuery(
    t.context.logger,
    t.context.connection,
    {
      ...clientConfiguration,
      queryRetryLimit: 1,
    },
    'SELECT 1 AS foo',
    [],
    'foo',
    executionRoutineStub,
  ));

  t.is(executionRoutineStub.callCount, 2);
  t.true(error instanceof Error);
  t.is(error.code, '40P01');
});

test('transaction errors are not handled if the function was called by a transaction', async (t) => {
  const executionRoutineStub = sinon.stub();

  executionRoutineStub.onFirstCall()
    .rejects(createErrorWithCode('40P01'));

  t.context.connection.connection.slonik.transactionId = 'foobar';

  const clientConfiguration = createClientConfiguration();

  const error: any = await t.throwsAsync(executeQuery(
    t.context.logger,
    t.context.connection,
    {
      ...clientConfiguration,
      queryRetryLimit: 1,
    },
    'SELECT 1 AS foo',
    [],
    'foo',
    executionRoutineStub,
  ));

  t.is(executionRoutineStub.callCount, 1);
  t.true(error instanceof Error);
  t.is(error.code, '40P01');
});
