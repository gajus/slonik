import { createPgDriverFactory } from '../factories/createPgDriverFactory';
import { createPool } from '../factories/createPool';
import { createErrorWithCode } from '../helpers.test/createErrorWithCode';
import { createPoolWithSpy } from '../helpers.test/createPoolWithSpy';
import { createTestRunner } from '../helpers.test/createTestRunner';
import * as sinon from 'sinon';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

test('creates a savepoint', async (t) => {
  const { spy, pool } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
  });

  await pool.transaction(async (transactionConnection) => {
    await transactionConnection.transaction(async () => {});
  });

  t.is(spy.query.getCall(0).args[0], 'START TRANSACTION');
  t.is(spy.query.getCall(1).args[0], 'SAVEPOINT slonik_savepoint_1');
});

test('rollbacks unsuccessful nested transaction', async (t) => {
  const { spy, pool } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
  });

  await t.throwsAsync(
    pool.transaction(async (transactionConnection) => {
      return await transactionConnection.transaction(async () => {
        return await Promise.reject(new Error('foo'));
      });
    }),
  );

  t.is(spy.query.getCall(1).args[0], 'SAVEPOINT slonik_savepoint_1');
  t.is(
    spy.query.getCall(2).args[0],
    'ROLLBACK TO SAVEPOINT slonik_savepoint_1',
  );
});

test('retries a nested transaction that failed due to a transaction error', async (t) => {
  const pool = await createPool(t.context.dsn);
  const handlerStub = sinon.stub();

  handlerStub
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

  const result = await pool.transaction(async (transactionConnection) => {
    return await transactionConnection.transaction(handlerStub);
  });

  t.is(handlerStub.callCount, 2);
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

test('commits successful transaction with retries', async (t) => {
  const { spy, pool } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
  });

  const handlerStub = sinon.stub();

  handlerStub
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

  await pool.transaction(async (transactionConnection) => {
    return await transactionConnection.transaction(handlerStub);
  });

  t.is(spy.query.getCall(1).args[0], 'SAVEPOINT slonik_savepoint_1');
  t.is(
    spy.query.getCall(2).args[0],
    'ROLLBACK TO SAVEPOINT slonik_savepoint_1',
  );
  t.is(spy.query.getCall(3).args[0], 'SAVEPOINT slonik_savepoint_1');
  t.is(spy.query.getCall(4).args[0], 'COMMIT');
});

test('returns the thrown transaction error if the retry limit is reached', async (t) => {
  const pool = await createPool(t.context.dsn);

  const handlerStub = sinon.stub();

  handlerStub
    .onFirstCall()
    .rejects(createErrorWithCode('40P01'))
    .onSecondCall()
    .rejects(createErrorWithCode('40P01'));

  const error: any = await t.throwsAsync(
    pool.transaction(async (transactionConnection) => {
      return await transactionConnection.transaction(handlerStub, 1);
    }, 0),
  );

  t.is(handlerStub.callCount, 2);

  t.true(error instanceof Error);
  t.is(error?.code, '40P01');
});

test('rollbacks unsuccessful nested transaction with retries', async (t) => {
  const { spy, pool } = await createPoolWithSpy(t.context.dsn, {
    driverFactory,
  });

  const handlerStub = sinon.stub();

  handlerStub
    .onFirstCall()
    .rejects(createErrorWithCode('40P01'))
    .onSecondCall()
    .rejects(createErrorWithCode('40P01'));

  await t.throwsAsync(
    pool.transaction(async (transactionConnection) => {
      return await transactionConnection.transaction(handlerStub, 1);
    }, 0),
  );

  t.is(spy.query.getCall(1).args[0], 'SAVEPOINT slonik_savepoint_1');
  t.is(
    spy.query.getCall(2).args[0],
    'ROLLBACK TO SAVEPOINT slonik_savepoint_1',
  );
  t.is(spy.query.getCall(3).args[0], 'SAVEPOINT slonik_savepoint_1');
  t.is(
    spy.query.getCall(4).args[0],
    'ROLLBACK TO SAVEPOINT slonik_savepoint_1',
  );
});
