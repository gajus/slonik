/* eslint-disable canonical/id-match */

import { createClientConfiguration } from './createClientConfiguration';
import { createConnectionPool, createDriver } from './createConnectionPool';
import test from 'ava';
import { setTimeout as delay } from 'node:timers/promises';

const createSimpleConnectionClientFactory = () => {
  return createDriver(async () => {
    return () => {
      return {
        connect: async () => {},
        end: async () => {},
        query: async () => {
          return {
            command: 'SELECT',
            fields: [
              {
                dataTypeId: 23,
                name: 'id',
              },
            ],
            rowCount: 1,
            rows: [
              {
                id: 1,
              },
            ],
          };
        },
      };
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
    ended: false,
    idleConnections: 0,
    waitingClients: 0,
  });

  const client = await connectionPool.acquire();

  t.deepEqual(connectionPool.state(), {
    activeConnections: 1,
    ended: false,
    idleConnections: 0,
    waitingClients: 0,
  });

  const result = await client.query('SELECT 1', []);

  t.like(result, {
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
    ended: false,
    idleConnections: 1,
    waitingClients: 0,
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
    ended: false,
    idleConnections: 0,
    waitingClients: 1,
  });

  await client1.release();

  const client2 = await client2Promise;

  t.deepEqual(connectionPool.state(), {
    activeConnections: 1,
    ended: false,
    idleConnections: 0,
    waitingClients: 0,
  });

  await client2.release();

  t.deepEqual(connectionPool.state(), {
    activeConnections: 0,
    ended: false,
    idleConnections: 1,
    waitingClients: 0,
  });
});

test('destroys idle connections', async (t) => {
  const clientConfiguration = createClientConfiguration(
    'postgres://localhost:5432/test',
    {
      idleTimeout: 100,
    },
  );

  const connectionPool = createConnectionPool({
    clientConfiguration,
    createClient: createSimpleConnectionClientFactory(),
  });

  const client = await connectionPool.acquire();

  await client.release();

  t.deepEqual(connectionPool.state(), {
    activeConnections: 0,
    ended: false,
    idleConnections: 1,
    waitingClients: 0,
  });

  await delay(200);

  t.deepEqual(connectionPool.state(), {
    activeConnections: 0,
    ended: false,
    idleConnections: 0,
    waitingClients: 0,
  });
});
