import { sql } from '..';
import { createPool } from '../factories/createPool';
import { type DriverFactory } from '@slonik/driver';
import anyTest, { type TestFn } from 'ava';

const POSTGRES_DSN =
  // eslint-disable-next-line n/no-process-env
  process.env.POSTGRES_DSN ?? 'postgresql://postgres:postgres@localhost:5432';

export type TestContextType = {
  dsn: string;
  testDatabaseName: string;
};

export const createTestRunner = (
  driverFactory: DriverFactory,
  name: string,
) => {
  let testId = 0;

  const test = anyTest as TestFn<TestContextType>;
  const { beforeEach } = test;

  const TEMPLATE_DATABASE_NAME = 'slonik_test';

  // eslint-disable-next-line id-length
  beforeEach(async (t) => {
    ++testId;

    const TEST_DATABASE_NAME = ['slonik_test', name, String(testId)].join('_');

    // eslint-disable-next-line id-length
    t.context = {
      dsn: POSTGRES_DSN + '/' + TEST_DATABASE_NAME,
      testDatabaseName: TEST_DATABASE_NAME,
    };

    const pool0 = await createPool(POSTGRES_DSN, {
      driverFactory,
      maximumPoolSize: 1,
    });

    await pool0.connect(async (connection) => {
      await connection.query(sql.unsafe`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE
          pid != pg_backend_pid() AND
          datname = ${TEMPLATE_DATABASE_NAME}
      `);
      await connection.query(
        sql.unsafe`DROP DATABASE IF EXISTS ${sql.identifier([
          TEST_DATABASE_NAME,
        ])}`,
      );
      await connection.query(
        sql.unsafe`CREATE DATABASE ${sql.identifier([TEST_DATABASE_NAME])}`,
      );
    });

    await pool0.end();

    const pool1 = await createPool(t.context.dsn, {
      driverFactory,
      maximumPoolSize: 1,
    });

    await pool1.connect(async (connection) => {
      await connection.query(sql.unsafe`
        CREATE TABLE person (
          id SERIAL PRIMARY KEY,
          name text NOT NULL,
          tags text[],
          birth_date date,
          payload bytea,
          molecules int8,
          updated_no_tz_at timestamp without time zone NOT NULL DEFAULT now(),
          updated_at timestamp with time zone NOT NULL DEFAULT now()
        )
      `);
    });

    await pool1.end();
  });

  return {
    test,
  };
};
