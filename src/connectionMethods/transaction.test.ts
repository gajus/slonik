import { createClientConfiguration } from '../helpers/createClientConfiguration';
import { createErrorWithCode } from '../helpers/createErrorWithCode';
import { createPool } from '../helpers/createPool';
import test from 'ava';
import * as sinon from 'sinon';

test('commits successful transaction', async (t) => {
  const pool = await createPool();

  await pool.transaction(async () => {});

  t.is(pool.querySpy.getCall(0).args[0], 'START TRANSACTION');
  t.is(pool.querySpy.getCall(1).args[0], 'COMMIT');
});

test('rollbacks unsuccessful transaction', async (t) => {
  const pool = await createPool();

  await t.throwsAsync(
    pool.transaction(async () => {
      return await Promise.reject(new Error('foo'));
    }),
  );

  t.is(pool.querySpy.getCall(0).args[0], 'START TRANSACTION');
  t.is(pool.querySpy.getCall(1).args[0], 'ROLLBACK');
});

test('retries a transaction that failed due to a transaction error', async (t) => {
  const pool = await createPool(createClientConfiguration());
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

  const result = await pool.transaction(handlerStub);

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
  const pool = await createPool(createClientConfiguration());
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

  await pool.transaction(handlerStub);

  t.is(pool.querySpy.getCall(0).args[0], 'START TRANSACTION');
  t.is(pool.querySpy.getCall(1).args[0], 'ROLLBACK');
  t.is(pool.querySpy.getCall(2).args[0], 'START TRANSACTION');
  t.is(pool.querySpy.getCall(3).args[0], 'COMMIT');
});

test('returns the thrown transaction error if the retry limit is reached', async (t) => {
  const pool = await createPool(createClientConfiguration());
  const handlerStub = sinon.stub();

  handlerStub
    .onFirstCall()
    .rejects(createErrorWithCode('40P01'))
    .onSecondCall()
    .rejects(createErrorWithCode('40P01'));

  const error: any = await t.throwsAsync(pool.transaction(handlerStub, 1));

  t.is(handlerStub.callCount, 2);

  t.true(error instanceof Error);
  t.is(error.code, '40P01');
});

test('rollbacks unsuccessful transaction with retries', async (t) => {
  const pool = await createPool(createClientConfiguration());
  const handlerStub = sinon.stub();

  handlerStub
    .onFirstCall()
    .rejects(createErrorWithCode('40P01'))
    .onSecondCall()
    .rejects(createErrorWithCode('40P01'));

  await t.throwsAsync(pool.transaction(handlerStub, 1));

  t.is(pool.querySpy.getCall(0).args[0], 'START TRANSACTION');
  t.is(pool.querySpy.getCall(1).args[0], 'ROLLBACK');
  t.is(pool.querySpy.getCall(2).args[0], 'START TRANSACTION');
  t.is(pool.querySpy.getCall(3).args[0], 'ROLLBACK');
});
