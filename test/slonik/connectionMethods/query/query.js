// @flow

import test from 'ava';
import delay from 'delay';
import sinon from 'sinon';
import createPool from '../../../helpers/createPool';
import sql from '../../../../src/templateTags/sql';
import {
  BackendTerminatedError,
  CheckIntegrityConstraintViolationError,
  ForeignKeyIntegrityConstraintViolationError,
  NotNullIntegrityConstraintViolationError,
  UniqueIntegrityConstraintViolationError
} from '../../../../src/errors';

const createErrorWithCode = (code: string) => {
  const error = new Error('foo');

  // $FlowFixMe
  error.code = code;

  return error;
};

test('executes the query and returns the result', async (t) => {
  const pool = createPool();

  pool.querySpy.returns({
    rows: [
      {
        foo: 1
      }
    ]
  });

  const result = await pool.query(sql`SELECT 1`);

  t.deepEqual(result, {
    notices: [],
    rows: [
      {
        foo: 1
      }
    ]
  });
});

test('adds notices observed during the query execution to the query result object', async (t) => {
  const pool = createPool();

  let resolveQuery;

  pool.querySpy.reset();
  pool.querySpy.callsFake(() => {
    return new Promise((resolve) => {
      resolveQuery = resolve;
    });
  });

  const queryResultPromise = pool.query(sql`SELECT 1`);

  await delay(100);

  pool.connection.emit('notice', 'foo');
  pool.connection.emit('notice', 'bar');

  if (!resolveQuery) {
    throw new Error('Unexpected state.');
  }

  resolveQuery({
    rows: [
      {
        foo: 1
      }
    ]
  });

  t.deepEqual(await queryResultPromise, {
    notices: [
      'foo',
      'bar'
    ],
    rows: [
      {
        foo: 1
      }
    ]
  });
});

test('maps 23514 error code to CheckIntegrityConstraintViolationError', async (t) => {
  const pool = createPool();

  pool.querySpy.rejects(createErrorWithCode('23514'));

  await t.throwsAsync(pool.query(sql`SELECT 1`), CheckIntegrityConstraintViolationError);
});

test('maps 23503 error code to ForeignKeyIntegrityConstraintViolationError', async (t) => {
  const pool = createPool();

  pool.querySpy.rejects(createErrorWithCode('23503'));

  await t.throwsAsync(pool.query(sql`SELECT 1`), ForeignKeyIntegrityConstraintViolationError);
});

test('maps 23502 error code to NotNullIntegrityConstraintViolationError', async (t) => {
  const pool = createPool();

  pool.querySpy.rejects(createErrorWithCode('23502'));

  await t.throwsAsync(pool.query(sql`SELECT 1`), NotNullIntegrityConstraintViolationError);
});

test('maps 23505 error code to UniqueIntegrityConstraintViolationError', async (t) => {
  const pool = createPool();

  pool.querySpy.rejects(createErrorWithCode('23505'));

  await t.throwsAsync(pool.query(sql`SELECT 1`), UniqueIntegrityConstraintViolationError);
});

test('57P01 error causes the connection to be rejected (IMPLICIT_QUERY connection)', async (t) => {
  const pool = createPool();

  pool.querySpy.rejects(createErrorWithCode('57P01'));

  await t.throwsAsync(pool.query(sql`SELECT 1`), BackendTerminatedError);
});

// @todo https://github.com/gajus/slonik/issues/39
// eslint-disable-next-line ava/no-skip-test
test.skip('57P01 error causes the connection to be rejected (EXPLICIT connection)', async (t) => {
  const pool = createPool();

  pool.querySpy.rejects(createErrorWithCode('57P01'));

  const spy = sinon.spy();

  await t.throwsAsync(pool.connect(async (connection) => {
    try {
      await connection.query(sql`SELECT 1`);
    } catch (error) {
      //
    }

    spy();
  }), BackendTerminatedError);

  t.assert(spy.called === false);
});
