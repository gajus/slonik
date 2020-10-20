// @flow

import test from 'ava';
import delay from 'delay';
import sinon from 'sinon';
import {
  BackendTerminatedError,
  CheckIntegrityConstraintViolationError,
  ForeignKeyIntegrityConstraintViolationError,
  NotNullIntegrityConstraintViolationError,
  UniqueIntegrityConstraintViolationError,
} from '../../../../src/errors';
import {
  createSqlTag,
} from '../../../../src/factories/createSqlTag';
import {
  createPool,
} from '../../../helpers/createPool';

const sql = createSqlTag();

const createErrorWithCode = (code: string) => {
  const error = new Error('foo');

  // @ts-expect-error
  error.code = code;

  return error;
};

test('executes the query and returns the result', async (t) => {
  const pool = createPool();

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
  });

  const result = await pool.query(sql`SELECT 1`);

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

test('adds notices observed during the query execution to the query result object', async (t) => {
  const pool = createPool();

  let resolveQuery: any;

  pool.querySpy.reset();
  pool.querySpy.callsFake(() => {
    return new Promise((resolve) => {
      resolveQuery = resolve;
    });
  });

  const queryResultPromise = pool.query(sql`SELECT 1`);

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
  });

  await delay(100);

  t.is(pool.querySpy.callCount, 2);

  // This is the `DISCORD ALL` query.
  resolveQuery();

  t.deepEqual(await queryResultPromise, {
    command: 'SELECT',
    fields: [],
    notices: [
      'foo',
      'bar',
    ] as any[],
    rowCount: 1,
    rows: [
      {
        foo: 1,
      },
    ],
  });
});

test('maps 23514 error code to CheckIntegrityConstraintViolationError', async (t) => {
  const pool = createPool();

  pool.querySpy.rejects(createErrorWithCode('23514'));

  const error = await t.throwsAsync(pool.query(sql`SELECT 1`));

  t.true(error instanceof CheckIntegrityConstraintViolationError);
});

test('maps 23503 error code to ForeignKeyIntegrityConstraintViolationError', async (t) => {
  const pool = createPool();

  pool.querySpy.rejects(createErrorWithCode('23503'));

  const error = await t.throwsAsync(pool.query(sql`SELECT 1`));

  t.true(error instanceof ForeignKeyIntegrityConstraintViolationError);
});

test('maps 23502 error code to NotNullIntegrityConstraintViolationError', async (t) => {
  const pool = createPool();

  pool.querySpy.rejects(createErrorWithCode('23502'));

  const error = await t.throwsAsync(pool.query(sql`SELECT 1`));

  t.true(error instanceof NotNullIntegrityConstraintViolationError);
});

test('maps 23505 error code to UniqueIntegrityConstraintViolationError', async (t) => {
  const pool = createPool();

  pool.querySpy.rejects(createErrorWithCode('23505'));

  const error = await t.throwsAsync(pool.query(sql`SELECT 1`));

  t.true(error instanceof UniqueIntegrityConstraintViolationError);
});

test('57P01 error causes the connection to be rejected (IMPLICIT_QUERY connection)', async (t) => {
  const pool = createPool();

  pool.querySpy.rejects(createErrorWithCode('57P01'));

  const error = await t.throwsAsync(pool.query(sql`SELECT 1`));

  t.true(error instanceof BackendTerminatedError);
});

// @todo https://github.com/gajus/slonik/issues/39
// eslint-disable-next-line ava/no-skip-test
test.skip('57P01 error causes the connection to be rejected (EXPLICIT connection)', async (t) => {
  const pool = createPool();

  pool.querySpy.rejects(createErrorWithCode('57P01'));

  const spy = sinon.spy();

  const error = await t.throwsAsync(pool.connect(async (connection) => {
    try {
      await connection.query(sql`SELECT 1`);
    } catch {
      //
    }

    spy();
  }));

  t.true(error instanceof BackendTerminatedError);

  t.assert(spy.called === false);
});
