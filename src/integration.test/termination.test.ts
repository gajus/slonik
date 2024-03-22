/* eslint-disable no-console */

import { BackendTerminatedUnexpectedlyError, createPool, sql } from '..';
import test from 'ava';
import getPort from 'get-port';
import { execSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';

const startTestContainer = async () => {
  const dockerContainerName = `slonik-test-${randomUUID()}`;
  const servicePort = await getPort();

  const dockerArgs = [
    'run',
    '--name',
    dockerContainerName,
    '--rm',
    '-e',
    'POSTGRES_HOST_AUTH_METHOD=trust',
    '-p',
    servicePort + ':5432',
    'postgres:14',
    '-N 1000',
  ];

  const dockerProcess = spawn('docker', dockerArgs);

  dockerProcess.on('error', (error) => {
    console.error(error);
  });

  dockerProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  dockerProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  dockerProcess.on('exit', (code) => {
    console.log(`Docker process exited with code ${code}`);
  });

  await new Promise((resolve) => {
    dockerProcess.stdout.on('data', (data) => {
      if (
        data
          .toString()
          .includes('database system is ready to accept connections')
      ) {
        resolve(undefined);
      }
    });
  });

  await setTimeout(1_000);

  const terminate = () => {
    execSync(`docker kill ${dockerContainerName}`);
  };

  return {
    dsn: `postgresql://postgres@localhost:${servicePort}/postgres`,
    terminate,
  };
};

/**
 * @see https://github.com/brianc/node-postgres/issues/3083
 */
test('handles unexpected backend termination', async (t) => {
  try {
    const output = execSync('docker --version', { encoding: 'utf8' });

    console.log('Docker CLI is available:', output.trim());
  } catch {
    console.log('Skipper the test. Docker CLI is not available.');

    return;
  }

  const { dsn, terminate } = await startTestContainer();

  const pool = await createPool(dsn);

  // eslint-disable-next-line promise/prefer-await-to-then
  setTimeout(1_000).then(terminate);

  const error = await t.throwsAsync(pool.query(sql.unsafe`SELECT pg_sleep(2)`));

  t.true(error instanceof BackendTerminatedUnexpectedlyError);
});
