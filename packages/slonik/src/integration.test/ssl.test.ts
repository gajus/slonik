/* eslint-disable no-console */

import { createPool, sql } from '../index.js';
import test from 'ava';
import getPort from 'get-port';
import { execSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

export const startTestContainer = async () => {
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
    // see packages/test-ssls/README.md
    'slonik-ssl-test',
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
    servicePort,
    terminate,
  };
};

test('makes a connection using SSL', async (t) => {
  const { servicePort, terminate } = await startTestContainer();

  try {
    const searchParameters = new URLSearchParams();

    // TODO figure out how to test sslmode=require
    // We are now getting an error: SELF_SIGNED_CERT_IN_CHAIN
    searchParameters.set('sslmode', 'no-verify');

    searchParameters.set(
      'sslrootcert',
      fileURLToPath(import.meta.resolve('@slonik/test-ssls/root.crt')),
    );
    searchParameters.set(
      'sslcert',
      fileURLToPath(import.meta.resolve('@slonik/test-ssls/slonik.crt')),
    );
    searchParameters.set(
      'sslkey',
      fileURLToPath(import.meta.resolve('@slonik/test-ssls/slonik.key')),
    );

    const pool = await createPool(
      `postgresql://postgres@localhost:${servicePort}/postgres?${searchParameters}`,
    );

    const result = await pool.one(sql.unsafe`
      SELECT ssl
      FROM pg_stat_ssl
      JOIN pg_stat_activity
        ON pg_stat_ssl.pid = pg_stat_activity.pid;
    `);

    t.deepEqual(result, {
      ssl: true,
    });

    await pool.end();
  } finally {
    terminate();
  }
});
