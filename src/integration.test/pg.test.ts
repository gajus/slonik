import { createPool, sql } from '..';
import {
  createIntegrationTests,
  createTestRunner,
} from '../helpers/createIntegrationTests';
import { Pool as PgPool } from 'pg';

const { test } = createTestRunner(PgPool, 'pg');

createIntegrationTests(test, PgPool);

test('returns expected query result object (NOTICE)', async (t) => {
  const pool = await createPool(t.context.dsn, {
    PgPool,
  });

  await pool.query(sql.unsafe`
    CREATE OR REPLACE FUNCTION test_notice
      (
        v_test INTEGER
      ) RETURNS BOOLEAN
      LANGUAGE plpgsql
    AS
    $$
    BEGIN

      RAISE NOTICE '1. TEST NOTICE [%]',v_test;
      RAISE NOTICE '2. TEST NOTICE [%]',v_test;
      RAISE NOTICE '3. TEST NOTICE [%]',v_test;
      RAISE LOG '4. TEST LOG [%]',v_test;
      RAISE NOTICE '5. TEST NOTICE [%]',v_test;

      RETURN TRUE;
    END;
    $$;
  `);

  const result = await pool.query(
    sql.unsafe`SELECT * FROM test_notice(${10});`,
  );

  t.is(result.notices.length, 4);

  await pool.end();
});
