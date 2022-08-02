import {
  Pool as PgPool,
} from 'pg';
import postgres from 'postgres';
import {
  createPostgresBridge,
} from 'postgres-bridge';
import {
  createTestRunner,
  createIntegrationTests,
} from '../../helpers/createIntegrationTests';

const Pool = createPostgresBridge(postgres) as unknown as typeof PgPool;

const {
  test,
} = createTestRunner(Pool, 'postgres-bridge');

createIntegrationTests(
  test,
  PgPool,
);
