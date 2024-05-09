import anyTest, { type TestFn } from 'ava';
import { createPool, sql } from 'slonik';

// TODO deduplicate with slonik/src/factories/createTestRunner.ts

// eslint-disable-next-line n/no-process-env
const POSTGRES_DSN = process.env.POSTGRES_DSN ?? 'postgres@localhost:5432';

type TestContextType = {
  dsn: string;
  testDatabaseName: string;
};

export const createTestRunner = () => {
  let testId = 0;

  const test = anyTest as TestFn<TestContextType>;
  const { beforeEach } = test;

  const TEMPLATE_DATABASE_NAME = 'slonik_test';

  beforeEach(async (t) => {
    ++testId;

    const TEST_DATABASE_NAME = ['slonik_test', String(testId)].join('_');

    t.context = {
      dsn: 'postgresql://' + POSTGRES_DSN + '/' + TEST_DATABASE_NAME,
      testDatabaseName: TEST_DATABASE_NAME,
    };

    const pool0 = await createPool('postgresql://' + POSTGRES_DSN, {
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
  });

  return {
    test,
  };
};
