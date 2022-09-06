import {
  Client as PgClient,
  Pool as PgPool,
} from 'pg';
import {
  serializeError,
} from 'serialize-error';
import {
  Logger,
} from '../Logger';
import {
  bindPool,
} from '../binders/bindPool';
import {
  createTypeOverrides,
} from '../routines';
import {
  poolStateMap,
} from '../state';
import {
  type ClientConfigurationInput,
  type DatabasePool,
} from '../types';
import {
  createUid,
} from '../utilities';
import {
  createClientConfiguration,
} from './createClientConfiguration';
import {
  createPoolConfiguration,
} from './createPoolConfiguration';

/**
 * @param connectionUri PostgreSQL [Connection URI](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING).
 */
export const createPool = async (
  connectionUri: string,
  clientConfigurationInput?: ClientConfigurationInput,
): Promise<DatabasePool> => {
  const clientConfiguration = createClientConfiguration(clientConfigurationInput);

  const poolId = createUid();

  const poolLog = Logger.child({
    poolId,
  });

  const poolConfiguration = createPoolConfiguration(connectionUri, clientConfiguration);

  let Pool = clientConfiguration.PgPool;

  if (!Pool) {
    Pool = PgPool;
  }

  if (!Pool) {
    throw new Error('Unexpected state.');
  }

  const setupClient = new PgClient({
    connectionTimeoutMillis: poolConfiguration.connectionTimeoutMillis,
    database: poolConfiguration.database,
    host: poolConfiguration.host,
    password: poolConfiguration.password,
    port: poolConfiguration.port,
    ssl: poolConfiguration.ssl,
    user: poolConfiguration.user,
  });

  await setupClient.connect();

  const getTypeParser = await createTypeOverrides(
    setupClient,
    clientConfiguration.typeParsers,
  );

  await setupClient.end();

  const pool: PgPool = new Pool({
    ...poolConfiguration,
    types: {
      getTypeParser,
    },
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
      poolLog.error({
        error: serializeError(error),
      }, 'client error');
    });

    client.on('notice', (notice) => {
      poolLog.info({
        notice: {
          level: notice.name,
          message: notice.message,
        },
      }, 'notice message');
    });

    poolLog.debug({
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount,
      },
    }, 'created a new client connection');
  });

  // istanbul ignore next
  pool.on('acquire', () => {
    poolLog.debug({
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount,
      },
    }, 'client is checked out from the pool');
  });

  // istanbul ignore next
  pool.on('remove', () => {
    poolLog.debug({
      stats: {
        idleConnectionCount: pool.idleCount,
        totalConnectionCount: pool.totalCount,
        waitingRequestCount: pool.waitingCount,
      },
    }, 'client connection is closed and removed from the client pool');
  });

  return bindPool(
    poolLog,
    pool,
    clientConfiguration,
  );
};
