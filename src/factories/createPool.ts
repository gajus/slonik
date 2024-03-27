import { bindPool } from '../binders/bindPool';
import { Logger } from '../Logger';
import { type ClientConfigurationInput, type DatabasePool } from '../types';
import { createClientConfiguration } from './createClientConfiguration';
import { createConnectionPool } from './createConnectionPool';
import { type DriverFactory } from './createDriver';
import { createPgDriver } from './createPgDriver';
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

  const createClient: DriverFactory =
    clientConfiguration.driver ?? createPgDriver();

  const pool = createConnectionPool({
    clientConfiguration,
    createClient,
    ...createPoolConfiguration(clientConfiguration),
  });

  return bindPool(
    Logger.child({
      poolId: pool.id(),
    }),
    pool,
    clientConfiguration,
  );
};
