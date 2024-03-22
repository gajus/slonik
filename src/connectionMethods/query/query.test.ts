import {
  BackendTerminatedError,
  CheckIntegrityConstraintViolationError,
  ForeignKeyIntegrityConstraintViolationError,
  NotNullIntegrityConstraintViolationError,
  UniqueIntegrityConstraintViolationError,
} from '../../errors';
import { createSqlTag } from '../../factories/createSqlTag';
import { createErrorWithCode } from '../../helpers/createErrorWithCode';
import { createPool } from '../../helpers/createPool';
import test from 'ava';
import { setTimeout as delay } from 'node:timers/promises';
import * as sinon from 'sinon';

export const createErrorWithCodeAndConstraint = (code: string) => {
  const error = createErrorWithCode(code);

  // @ts-expect-error – This is a test helper.
  error.constraint = 'foo';

  return error;
};

const sql = createSqlTag();

test('ends connection after promise is resolved (explicit connection)', async (t) => {
  const eventHandler = sinon.spy();

  process.on('warning', eventHandler);

  const pool = await createPool();

  await pool.connect(async (connection) => {
    let queryCount = 20;

    const queries: Array<Promise<unknown>> = [];

    while (queryCount-- > 0) {
      queries.push(connection.query(sql.unsafe`SELECT 1`));
    }

    await Promise.all(queries);
  });

  // Not entirely clear why delay is needed here,
  // but event is not emitted straight after the transaction completes.
  await delay(100);

  t.false(eventHandler.called);
});

test('executes the query and returns the result', async (t) => {
  const pool = await createPool();

  pool.querySpy.returns({
    command: 'SELECT',
    fields: [],
    notices: [],
    rowCount: 1,
    rows: [
      {
        foo: 1,
      },
    ],
    type: 'QueryResult',
  });

  const result = await pool.query(sql.unsafe`SELECT 1`);

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
    type: 'QueryResult',
  });
});

test('adds notices observed during the query execution to the query result object', async (t) => {
  const pool = await createPool();

  let resolveQuery: any;

  pool.querySpy.reset();
  pool.querySpy.callsFake(async () => {
    return await new Promise((resolve) => {
      resolveQuery = resolve;
    });
  });

  const queryResultPromise = pool.query(sql.unsafe`SELECT 1`);

  await delay(100);

  t.is(pool.querySpy.callCount, 1);

  pool.connection.emit('notice', 'foo');
  pool.connection.emit('notice', 'bar');

  if (!resolveQuery) {
    throw new Error('Unexpected state.');
  }

  resolveQuery({
    command: 'SELECT',
    fields: [],
    notices: [],
    rowCount: 1,
    rows: [
      {
        foo: 1,
      },
    ],
    type: 'QueryResult',
  });

  await delay(100);

  t.is(pool.querySpy.callCount, 1);

  t.deepEqual(await queryResultPromise, {
    command: 'SELECT',
    fields: [],
    notices: ['foo', 'bar'] as any[],
    rowCount: 1,
    rows: [
      {
        foo: 1,
      },
    ],
    type: 'QueryResult',
  });
});

test('maps 23514 error code to CheckIntegrityConstraintViolationError', async (t) => {
  const pool = await createPool();

  pool.querySpy.rejects(createErrorWithCodeAndConstraint('23514'));

  const error = await t.throwsAsync(pool.query(sql.unsafe`SELECT 1`));

  t.true(error instanceof CheckIntegrityConstraintViolationError);
});

test('maps 23503 error code to ForeignKeyIntegrityConstraintViolationError', async (t) => {
  const pool = await createPool();

  pool.querySpy.rejects(createErrorWithCodeAndConstraint('23503'));

  const error = await t.throwsAsync(pool.query(sql.unsafe`SELECT 1`));

  t.true(error instanceof ForeignKeyIntegrityConstraintViolationError);
});

test('maps 23502 error code to NotNullIntegrityConstraintViolationError', async (t) => {
  const pool = await createPool();

  pool.querySpy.rejects(createErrorWithCodeAndConstraint('23502'));

  const error = await t.throwsAsync(pool.query(sql.unsafe`SELECT 1`));

  t.true(error instanceof NotNullIntegrityConstraintViolationError);
});

test('maps 23505 error code to UniqueIntegrityConstraintViolationError', async (t) => {
  const pool = await createPool();

  pool.querySpy.rejects(createErrorWithCodeAndConstraint('23505'));

  const error = await t.throwsAsync(pool.query(sql.unsafe`SELECT 1`));

  t.true(error instanceof UniqueIntegrityConstraintViolationError);
});

test('57P01 error causes the connection to be rejected (IMPLICIT_QUERY connection)', async (t) => {
  const pool = await createPool();

  pool.querySpy.rejects(createErrorWithCode('57P01'));

  const error = await t.throwsAsync(pool.query(sql.unsafe`SELECT 1`));

  t.true(error instanceof BackendTerminatedError);
});

// @todo https://github.com/gajus/slonik/issues/39
// eslint-disable-next-line ava/no-skip-test
test.skip('57P01 error causes the connection to be rejected (EXPLICIT connection)', async (t) => {
  const pool = await createPool();

  pool.querySpy.rejects(createErrorWithCode('57P01'));

  const spy = sinon.spy();

  const error = await t.throwsAsync(
    pool.connect(async (connection) => {
      try {
        await connection.query(sql.unsafe`SELECT 1`);
      } catch {
        //
      }

      spy();
    }),
  );

  t.true(error instanceof BackendTerminatedError);
  t.true(spy.called);
});
