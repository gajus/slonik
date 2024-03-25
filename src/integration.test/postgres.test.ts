import { NativePostgresPool } from '../classes/NativePostgres';
import {
  createIntegrationTests,
  createTestRunner,
} from '../helpers/createIntegrationTests';
import postgres from 'postgres';
import { createPostgresBridge } from 'postgres-bridge';

const Pool = createPostgresBridge(
  postgres,
) as unknown as typeof NativePostgresPool;

const { test } = createTestRunner(Pool, 'postgres-bridge');

createIntegrationTests(test, NativePostgresPool);
