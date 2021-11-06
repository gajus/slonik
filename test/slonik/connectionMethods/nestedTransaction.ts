import test from 'ava';
import sinon from 'sinon';
import {
  createClientConfiguration,
} from '../../helpers/createClientConfiguration';
import {
  createErrorWithCode,
} from '../../helpers/createErrorWithCode';
import {
  createPool,
} from '../../helpers/createPool';

test('creates a savepoint', async (t) => {
  const pool = createPool();

  await pool.transaction(async (transactionConnection) => {
    return transactionConnection.transaction(async () => {});
  });

  t.assert(pool.querySpy.getCall(0).args[0] === 'START TRANSACTION');
  t.assert(pool.querySpy.getCall(1).args[0] === 'SAVEPOINT slonik_savepoint_1');
});

test('rollbacks unsuccessful nested transaction', async (t) => {
  const pool = createPool();

  await t.throwsAsync(pool.transaction(async (transactionConnection) => {
    return transactionConnection.transaction(async () => {
      return Promise.reject(new Error('foo'));
    });
  }));

  t.assert(pool.querySpy.getCall(1).args[0] === 'SAVEPOINT slonik_savepoint_1');
  t.assert(pool.querySpy.getCall(2).args[0] === 'ROLLBACK TO SAVEPOINT slonik_savepoint_1');
});

test('retries a nested transaction that failed due to a transaction error', async (t) => {
  const pool = createPool(createClientConfiguration());
  const handlerStub = sinon.stub();

  handlerStub.onFirstCall()
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
    return transactionConnection.transaction(handlerStub);
  });

  t.assert(handlerStub.callCount === 2);
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
  const pool = createPool(createClientConfiguration());
  const handlerStub = sinon.stub();

  handlerStub.onFirstCall()
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
    return transactionConnection.transaction(handlerStub);
  });

  t.assert(pool.querySpy.getCall(1).args[0] === 'SAVEPOINT slonik_savepoint_1');
  t.assert(pool.querySpy.getCall(2).args[0] === 'ROLLBACK TO SAVEPOINT slonik_savepoint_1');
  t.assert(pool.querySpy.getCall(3).args[0] === 'SAVEPOINT slonik_savepoint_1');
  t.assert(pool.querySpy.getCall(4).args[0] === 'COMMIT');
});

test('returns the thrown transaction error if the retry limit is reached', async (t) => {
  const clientConfiguration = createClientConfiguration();

  const pool = createPool(clientConfiguration);
  const handlerStub = sinon.stub();

  handlerStub.onFirstCall()
    .rejects(createErrorWithCode('40P01'))
    .onSecondCall()
    .rejects(createErrorWithCode('40P01'));

  const error: Error & {code: string, } = await t.throwsAsync(pool.transaction(async (transactionConnection) => {
    return transactionConnection.transaction(handlerStub, 1);
  }, 0));

  t.assert(handlerStub.callCount === 2);

  t.assert(error instanceof Error);
  t.assert(error.code === '40P01');
});

test('rollbacks unsuccessful nested transaction with retries', async (t) => {
  const pool = createPool(createClientConfiguration());
  const handlerStub = sinon.stub();

  handlerStub.onFirstCall()
    .rejects(createErrorWithCode('40P01'))
    .onSecondCall()
    .rejects(createErrorWithCode('40P01'));

  await t.throwsAsync(pool.transaction(async (transactionConnection) => {
    return transactionConnection.transaction(handlerStub, 1);
  }, 0));

  t.assert(pool.querySpy.getCall(1).args[0] === 'SAVEPOINT slonik_savepoint_1');
  t.assert(pool.querySpy.getCall(2).args[0] === 'ROLLBACK TO SAVEPOINT slonik_savepoint_1');
  t.assert(pool.querySpy.getCall(3).args[0] === 'SAVEPOINT slonik_savepoint_1');
  t.assert(pool.querySpy.getCall(4).args[0] === 'ROLLBACK TO SAVEPOINT slonik_savepoint_1');
});
