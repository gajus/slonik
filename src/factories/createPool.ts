import { bindPool } from '../binders/bindPool';
import { Logger } from '../Logger';
import { getPoolState, poolStateMap } from '../state';
import { type ClientConfigurationInput, type DatabasePool } from '../types';
import { createUid } from '../utilities/createUid';
import { createClientConfiguration } from './createClientConfiguration';
import {
  type ConnectionPoolClientFactory,
  createConnectionPool,
} from './createConnectionPool';
import { createPgPoolClientFactory } from './createPgPoolClientFactory';
import { createPoolConfiguration } from './createPoolConfiguration';

/**
 * @param connectionUri PostgreSQL [Connection URI](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING).
 */
export const createPool = async (
  connectionUri: string,
  clientConfigurationInput?: ClientConfigurationInput,
): Promise<DatabasePool> => {
  const clientConfiguration = createClientConfiguration(
    connectionUri,
    clientConfigurationInput,
  );

  const createClient: ConnectionPoolClientFactory =
    clientConfiguration.client ?? createPgPoolClientFactory();

  const pool = createConnectionPool({
    clientConfiguration,
    createClient,
    ...createPoolConfiguration(clientConfiguration),
  });

  // TODO refactor: this is a leftover from the old implementation
  const poolId = createUid();

  // TODO refactor: this is a leftover from the old implementation
  poolStateMap.set(pool, {
    ended: false,
    mock: false,
    poolId,
    typeOverrides: null,
  });

  return bindPool(
    Logger.child({
      poolId: getPoolState(pool).poolId,
    }),
    pool,
    clientConfiguration,
  );
};
