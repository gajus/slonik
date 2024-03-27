import {
  BackendTerminatedError,
  CheckIntegrityConstraintViolationError,
  ForeignKeyIntegrityConstraintViolationError,
  NotNullIntegrityConstraintViolationError,
  UniqueIntegrityConstraintViolationError,
} from '../../errors';
import { createPgDriver } from '../../factories/createPgDriver';
import { createPool } from '../../factories/createPool';
import { createSqlTag } from '../../factories/createSqlTag';
import { createErrorWithCode } from '../../helpers.test/createErrorWithCode';
import { createPoolWithMockedQuery } from '../../helpers.test/createPoolWithMockedQuery';
import { createTestRunner } from '../../helpers.test/createTestRunner';
import * as sinon from 'sinon';

const driver = createPgDriver();

const { test } = createTestRunner(driver, 'pg');

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

  const pool = await createPool(t.context.dsn, { driver });

  await pool.connect(async (connection) => {
    let queryCount = 20;

    const queries: Array<Promise<unknown>> = [];

    while (queryCount-- > 0) {
      queries.push(connection.query(sql.unsafe`SELECT 1`));
    }

    await Promise.all(queries);
  });

  t.false(eventHandler.called);
});

test('executes the query and returns the result', async (t) => {
  const pool = await createPool(t.context.dsn, { driver });

  const result = await pool.query(sql.unsafe`
    SELECT *
    FROM (VALUES (1)) as t(id)
  `);

  t.deepEqual(result, {
    command: 'SELECT',
    fields: [
      {
        dataTypeId: 23,
        name: 'id',
      },
    ],
    notices: [],
    rowCount: 1,
    rows: [
      {
        id: 1,
      },
    ],
    type: 'QueryResult',
  });
});

test('maps 23514 error code to CheckIntegrityConstraintViolationError', async (t) => {
  const { pool, query } = await createPoolWithMockedQuery(t.context.dsn, {
    driver,
  });

  query.rejects(createErrorWithCodeAndConstraint('23514'));

  const error = await t.throwsAsync(pool.query(sql.unsafe`SELECT 1`));

  t.true(error instanceof CheckIntegrityConstraintViolationError);
});

test('maps 23503 error code to ForeignKeyIntegrityConstraintViolationError', async (t) => {
  const { pool, query } = await createPoolWithMockedQuery(t.context.dsn, {
    driver,
  });

  query.rejects(createErrorWithCodeAndConstraint('23503'));

  const error = await t.throwsAsync(pool.query(sql.unsafe`SELECT 1`));

  t.true(error instanceof ForeignKeyIntegrityConstraintViolationError);
});

test('maps 23502 error code to NotNullIntegrityConstraintViolationError', async (t) => {
  const { pool, query } = await createPoolWithMockedQuery(t.context.dsn, {
    driver,
  });

  query.rejects(createErrorWithCodeAndConstraint('23502'));

  const error = await t.throwsAsync(pool.query(sql.unsafe`SELECT 1`));

  t.true(error instanceof NotNullIntegrityConstraintViolationError);
});

test('maps 23505 error code to UniqueIntegrityConstraintViolationError', async (t) => {
  const { pool, query } = await createPoolWithMockedQuery(t.context.dsn, {
    driver,
  });

  query.rejects(createErrorWithCodeAndConstraint('23505'));

  const error = await t.throwsAsync(pool.query(sql.unsafe`SELECT 1`));

  t.true(error instanceof UniqueIntegrityConstraintViolationError);
});

test('57P01 error causes the connection to be rejected (IMPLICIT_QUERY connection)', async (t) => {
  const { pool, query } = await createPoolWithMockedQuery(t.context.dsn, {
    driver,
  });

  query.rejects(createErrorWithCode('57P01'));

  const error = await t.throwsAsync(pool.query(sql.unsafe`SELECT 1`));

  t.true(error instanceof BackendTerminatedError);
});
