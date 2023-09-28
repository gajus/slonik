import { Logger } from '../Logger';
import { poolStateMap } from '../state';
import { createUid } from '../utilities/createUid';
import { type Pool as PgPool, type PoolConfig } from 'pg';
import { serializeError } from 'serialize-error';

export const createInternalPool = (
  Pool: new (poolConfig: PoolConfig) => PgPool,
  poolConfiguration: PoolConfig,
) => {
  const poolId = createUid();

  const poolLog = Logger.child({
    poolId,
  });

  const pool: PgPool = new Pool({
    ...poolConfiguration,
  });

  // https://github.com/gajus/slonik/issues/471
  pool.on('error', (error) => {
    poolLog.error(
      {
        error: serializeError(error),
      },
      'client error',
    );
  });

  poolStateMap.set(pool, {
    ended: false,
    mock: false,
    poolId,
    typeOverrides: null,
  });

  // istanbul ignore next
  pool.on('connect', (client) => {
    client.on('error', (error) => {
      poolLog.error(
        {
          error: serializeError(error),
        },
        'client error',
      );
    });

    client.on('notice', (notice) => {
      poolLog.info(
        {
          notice: {
            level: notice.name,
            message: notice.message,
          },
        },
        'notice message',
      );
    });

    poolLog.debug(
      {
        stats: {
          idleConnectionCount: pool.idleCount,
          totalConnectionCount: pool.totalCount,
          waitingRequestCount: pool.waitingCount,
        },
      },
      'created a new client connection',
    );
  });

  // istanbul ignore next
  pool.on('acquire', () => {
    poolLog.debug(
      {
        stats: {
          idleConnectionCount: pool.idleCount,
          totalConnectionCount: pool.totalCount,
          waitingRequestCount: pool.waitingCount,
        },
      },
      'client is checked out from the pool',
    );
  });

  // istanbul ignore next
  pool.on('remove', () => {
    poolLog.debug(
      {
        stats: {
          idleConnectionCount: pool.idleCount,
          totalConnectionCount: pool.totalCount,
          waitingRequestCount: pool.waitingCount,
        },
      },
      'client connection is closed and removed from the client pool',
    );
  });

  return pool;
};
