/* eslint-disable no-console */

import { createPool, sql } from '..';
import { startTestContainer } from './termination.test';
import test from 'ava';
import { execSync } from 'node:child_process';

/**
 * @see https://github.com/gajus/slonik/issues/631
 */
test('releases failed connections', async (t) => {
  t.timeout(10_000);

  try {
    const output = execSync('docker --version', { encoding: 'utf8' });
    console.log('Docker CLI is available:', output.trim());
  } catch {
    console.log('Skipper the test. Docker CLI is not available.');

    return;
  }

  const { dsn, terminate } = await startTestContainer();

  const pool = await createPool(dsn, {
    connectionRetryLimit: 1,
    connectionTimeout: 500,
    maximumPoolSize: 1,
  });

  terminate();

  const isConnectionAvailable = async () => {
    try {
      await pool.connect((connection) => {
        return connection.oneFirst(sql.unsafe`SELECT NOW()`);
      });
      return true;
    } catch {
      // do nothing
    }

    return false;
  };

  t.deepEqual(
    [await isConnectionAvailable(), await isConnectionAvailable()],
    [false, false],
  );
});
