import {
  createIntegrationTests,
  createTestRunner,
} from '../helpers/createIntegrationTests';
import { Pool as PgPool } from 'pg';
import postgres from 'postgres';
import { createPostgresBridge } from 'postgres-bridge';

const Pool = createPostgresBridge(postgres) as unknown as typeof PgPool;

const { test } = createTestRunner(Pool, 'postgres-bridge');

createIntegrationTests(test, PgPool);
