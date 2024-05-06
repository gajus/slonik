import { sql } from '..';
import { createPgDriverFactory } from '../factories/createPgDriverFactory';
import { createPool } from '../factories/createPool';
import { createIntegrationTests } from '../helpers.test/createIntegrationTests';
import { createTestRunner } from '../helpers.test/createTestRunner';

const driverFactory = createPgDriverFactory();

const { test } = createTestRunner(driverFactory, 'pg');

createIntegrationTests(test, driverFactory);

test('returns expected query result object (NOTICE)', async (t) => {
  const pool = await createPool(t.context.dsn, {
    driverFactory,
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
