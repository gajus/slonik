/* eslint-disable canonical/id-match */

import { createClientConfiguration } from './createClientConfiguration';
import {
  createConnectionPool,
  createPoolClientFactory,
} from './createConnectionPool';
import test from 'ava';

const createSimpleConnectionClientFactory = () => {
  return createPoolClientFactory(() => {
    return {
      connect: async () => {},
      end: async () => {},
      query: async () => {
        return {
          rows: [
            {
              id: 1,
            },
          ],
        };
      },
    };
  });
};

test('acquires connection', async (t) => {
  const clientConfiguration = createClientConfiguration(
    'postgres://localhost:5432/test',
    {},
  );

  const connectionPool = createConnectionPool({
    clientConfiguration,
    createClient: createSimpleConnectionClientFactory(),
  });

  t.deepEqual(connectionPool.state(), {
    activeConnections: 0,
    idleConnections: 0,
    pendingConnections: 0,
  });

  const client = await connectionPool.acquire();

  t.deepEqual(connectionPool.state(), {
    activeConnections: 1,
    idleConnections: 0,
    pendingConnections: 0,
  });

  const result = await client.query('SELECT 1', []);

  t.deepEqual(result, {
    rows: [
      {
        id: 1,
      },
    ],
  });
});

test('releases connection', async (t) => {
  const clientConfiguration = createClientConfiguration(
    'postgres://localhost:5432/test',
    {},
  );

  const connectionPool = createConnectionPool({
    clientConfiguration,
    createClient: createSimpleConnectionClientFactory(),
  });

  const client = await connectionPool.acquire();

  await client.release();

  t.deepEqual(connectionPool.state(), {
    activeConnections: 0,
    idleConnections: 1,
    pendingConnections: 0,
  });
});

test('queues connection acquisition', async (t) => {
  const clientConfiguration = createClientConfiguration(
    'postgres://localhost:5432/test',
    {},
  );

  const connectionPool = createConnectionPool({
    clientConfiguration,
    createClient: createSimpleConnectionClientFactory(),
    poolSize: 1,
  });

  const client1 = await connectionPool.acquire();

  const client2Promise = connectionPool.acquire();

  t.deepEqual(connectionPool.state(), {
    activeConnections: 1,
    idleConnections: 0,
    pendingConnections: 1,
  });

  await client1.release();

  const client2 = await client2Promise;

  t.deepEqual(connectionPool.state(), {
    activeConnections: 1,
    idleConnections: 0,
    pendingConnections: 0,
  });

  await client2.release();

  t.deepEqual(connectionPool.state(), {
    activeConnections: 0,
    idleConnections: 1,
    pendingConnections: 0,
  });
});
