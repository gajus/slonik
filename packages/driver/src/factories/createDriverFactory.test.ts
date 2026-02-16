/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { createDriverFactory } from './createDriverFactory.js';
import type {
  DriverConfiguration,
  DriverQueryResult,
  DriverStream,
  DriverStreamResult,
} from './createDriverFactory.js';
import test from 'ava';

const waitTick = () =>
  new Promise<void>((resolve) => {
    setImmediate(resolve);
  });

const defaultQueryResult: DriverQueryResult = {
  command: 'SELECT',
  fields: [],
  rowCount: 0,
  rows: [],
};

const createMockSetup = (options?: {
  connectDelay?: number;
  queryDelay?: number;
  queryFn?: (sql: string, values?: unknown[]) => Promise<DriverQueryResult>;
}) => {
  const queries: string[] = [];

  return {
    queries,
    setup: async () => {
      return {
        createPoolClient: async () => {
          return {
            connect: async () => {
              if (options?.connectDelay) {
                await new Promise<void>((resolve) => {
                  setTimeout(resolve, options.connectDelay);
                });
              }
            },
            end: async () => {},
            query: async (
              sql: string,
              values?: unknown[],
            ): Promise<DriverQueryResult> => {
              queries.push(sql);

              if (options?.queryFn) {
                return options.queryFn(sql, values);
              }

              if (options?.queryDelay) {
                await new Promise<void>((resolve) => {
                  setTimeout(resolve, options.queryDelay);
                });
              }

              return defaultQueryResult;
            },
            stream: (): DriverStream<DriverStreamResult> => {
              throw new Error('Not implemented');
            },
          };
        },
      };
    },
  };
};

const createDefaultDriverConfig = (
  overrides?: Partial<DriverConfiguration>,
): DriverConfiguration => {
  return {
    connectionTimeout: 5_000,
    connectionUri: 'postgres://localhost/test',
    idleInTransactionSessionTimeout: 60_000,
    idleTimeout: 5_000,
    statementTimeout: 60_000,
    typeParsers: [],
    ...overrides,
  };
};

// ─── resetConnection runs in the background ────────────────────────────────

test('release resolves before resetConnection completes', async (t) => {
  const order: string[] = [];

  let resolveQuery: (() => void) | null = null;

  const { setup } = createMockSetup({
    queryFn: async (sql) => {
      order.push(`query:${sql}`);

      if (sql === 'DISCARD ALL') {
        await new Promise<void>((resolve) => {
          resolveQuery = resolve;
        });
      }

      order.push(`query-done:${sql}`);

      return defaultQueryResult;
    },
  });

  const factory = createDriverFactory(setup);
  const driver = await factory({
    driverConfiguration: createDefaultDriverConfig({
      resetConnection: async ({ query }) => {
        await query('DISCARD ALL');
      },
    }),
  });

  const client = await driver.createClient();
  client.acquire();

  order.push('release-start');
  await client.release();
  order.push('release-done');

  // Release should resolve before resetConnection completes
  t.true(order.includes('query:DISCARD ALL'));
  t.false(order.includes('query-done:DISCARD ALL'));

  // Complete the reset
  resolveQuery!();
  await waitTick();
  await waitTick();

  t.true(order.includes('query-done:DISCARD ALL'));
});

test('connection state is PENDING_RELEASE during reset', async (t) => {
  let resolveQuery: (() => void) | null = null;

  const { setup } = createMockSetup({
    queryFn: async (sql) => {
      if (sql === 'DISCARD ALL') {
        await new Promise<void>((resolve) => {
          resolveQuery = resolve;
        });
      }

      return defaultQueryResult;
    },
  });

  const factory = createDriverFactory(setup);
  const driver = await factory({
    driverConfiguration: createDefaultDriverConfig({
      resetConnection: async ({ query }) => {
        await query('DISCARD ALL');
      },
    }),
  });

  const client = await driver.createClient();
  client.acquire();

  t.is(client.state(), 'ACQUIRED');

  await client.release();

  // During reset, state should be PENDING_RELEASE
  t.is(client.state(), 'PENDING_RELEASE');

  // Complete the reset
  let releaseEmitted = false;

  client.on('release', () => {
    releaseEmitted = true;
  });

  resolveQuery!();
  await waitTick();
  await waitTick();

  // After reset completes, the release event should have fired
  t.true(releaseEmitted);
});

test('release event is emitted only after reset completes', async (t) => {
  let resolveQuery: (() => void) | null = null;
  let releaseEmitted = false;

  const { setup } = createMockSetup({
    queryFn: async (sql) => {
      if (sql === 'DISCARD ALL') {
        await new Promise<void>((resolve) => {
          resolveQuery = resolve;
        });
      }

      return defaultQueryResult;
    },
  });

  const factory = createDriverFactory(setup);
  const driver = await factory({
    driverConfiguration: createDefaultDriverConfig({
      resetConnection: async ({ query }) => {
        await query('DISCARD ALL');
      },
    }),
  });

  const client = await driver.createClient();

  client.on('release', () => {
    releaseEmitted = true;
  });

  client.acquire();
  await client.release();

  // Release event should NOT have fired yet
  t.false(releaseEmitted);

  // Complete the reset
  resolveQuery!();
  await waitTick();
  await waitTick();

  // Now the release event should fire
  t.true(releaseEmitted);
});

test('failed resetConnection destroys the connection', async (t) => {
  let destroyEmitted = false;

  const { setup } = createMockSetup({
    queryFn: async (sql) => {
      if (sql === 'DISCARD ALL') {
        throw new Error('connection lost');
      }

      return defaultQueryResult;
    },
  });

  const factory = createDriverFactory(setup);
  const driver = await factory({
    driverConfiguration: createDefaultDriverConfig({
      resetConnection: async ({ query }) => {
        await query('DISCARD ALL');
      },
    }),
  });

  const client = await driver.createClient();

  client.on('destroy', () => {
    destroyEmitted = true;
  });

  client.acquire();
  await client.release();

  // Give the reset time to fail and trigger destroy
  await waitTick();
  await waitTick();
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 50);
  });

  t.true(destroyEmitted);
});

test('destroy waits for in-progress reset via graceful termination timeout', async (t) => {
  let resolveQuery: (() => void) | null = null;
  const order: string[] = [];

  const { setup } = createMockSetup({
    queryFn: async (sql) => {
      if (sql === 'DISCARD ALL') {
        order.push('reset-started');
        await new Promise<void>((resolve) => {
          resolveQuery = resolve;
        });
        order.push('reset-done');
      }

      return defaultQueryResult;
    },
  });

  const factory = createDriverFactory(setup);
  const driver = await factory({
    driverConfiguration: createDefaultDriverConfig({
      gracefulTerminationTimeout: 5_000,
      resetConnection: async ({ query }) => {
        await query('DISCARD ALL');
      },
    }),
  });

  const client = await driver.createClient();
  client.acquire();
  await client.release();

  // Start destroy while reset is running
  const destroyPromise = client.destroy();

  // Let the reset complete
  resolveQuery!();

  await destroyPromise;

  order.push('destroy-done');

  t.true(order.includes('reset-started'));
  t.true(order.includes('destroy-done'));
});

test('connection cannot be acquired during reset', async (t) => {
  let resolveQuery: (() => void) | null = null;

  const { setup } = createMockSetup({
    queryFn: async (sql) => {
      if (sql === 'DISCARD ALL') {
        await new Promise<void>((resolve) => {
          resolveQuery = resolve;
        });
      }

      return defaultQueryResult;
    },
  });

  const factory = createDriverFactory(setup);
  const driver = await factory({
    driverConfiguration: createDefaultDriverConfig({
      resetConnection: async ({ query }) => {
        await query('DISCARD ALL');
      },
    }),
  });

  const client = await driver.createClient();
  client.acquire();
  await client.release();

  // State is PENDING_RELEASE during reset — acquire should throw
  t.is(client.state(), 'PENDING_RELEASE');
  t.throws(() => client.acquire(), {
    message: 'Client is pending release.',
  });

  // Clean up
  resolveQuery!();
  await waitTick();
  await waitTick();
});

test('without resetConnection, release emits immediately', async (t) => {
  let releaseEmitted = false;

  const { setup } = createMockSetup();

  const factory = createDriverFactory(setup);
  const driver = await factory({
    driverConfiguration: createDefaultDriverConfig(),
  });

  const client = await driver.createClient();

  client.on('release', () => {
    releaseEmitted = true;
  });

  client.acquire();
  await client.release();

  // Release event fires immediately when there's no resetConnection
  await waitTick();
  t.true(releaseEmitted);
});
