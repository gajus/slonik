/* eslint-disable no-console */

import { createPool } from '..';
// eslint-disable-next-line import/extensions
import { startTestContainer } from './termination.test';
import { createPgDriverFactory } from '@slonik/pg-driver';
import test from 'ava';
import { execSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

test('removes from pendingConnections when connection fails when there are multiple pending connections', async (t) => {
  t.timeout(10_000);

  try {
    const output = execSync('docker --version', { encoding: 'utf8' });
    console.log('Docker CLI is available:', output.trim());
  } catch {
    console.log('Skipper the test. Docker CLI is not available.');

    return;
  }

  const { dsn, terminate } = await startTestContainer();

  let connectionAttempt = 0;

  const pgDriverFactory = await createPgDriverFactory();

  const pool = await createPool(dsn, {
    connectionRetryLimit: 0,
    connectionTimeout: 500,
    driverFactory: async (config) => {
      const driver = await pgDriverFactory(config);

      return {
        createClient: async () => {
          connectionAttempt++;

          console.error('Connection attempt:', connectionAttempt);

          // Out of 3 connections, have the middle one fail and make sure it's removed properly from pendingConnections
          if (connectionAttempt === 2) {
            await delay(2_000);
            throw new Error('Connection failed.');
          }

          await delay(5_000);

          return driver.createClient();
        },
      };
    },
    idleTimeout: 30_000,
    maximumPoolSize: 5,
  });

  await Promise.allSettled(
    Array.from({ length: 3 }).map(() => pool.connect(() => Promise.resolve())),
  );

  t.like(pool.state(), {
    idleConnections: 2,
    pendingConnections: 0,
  });

  await pool.end();

  terminate();
});
