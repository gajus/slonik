import test from 'ava';
import {
  native as pgClient,
} from 'pg';
import {
  createTestRunner,
  createIntegrationTests,
} from '../../helpers/createIntegrationTests';

const {
  TEST_NATIVE_DRIVER,
} = process.env;

if (TEST_NATIVE_DRIVER === 'true') {
  const testRunner = createTestRunner(
    pgClient,
    'pg_native',
  );

  createIntegrationTests(
    testRunner.test,
    pgClient,
  );
} else {
  test.todo('pg-native integration tests are disabled; configure TEST_NATIVE_DRIVER=true to enable them');
}
