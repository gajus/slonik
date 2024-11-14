import { bindPool } from '../binders/bindPool';
import { Logger } from '../Logger';
import {
  type ClientConfigurationInput,
  type DatabasePool,
  type DatabasePoolEventEmitter,
} from '../types';
import { createClientConfiguration } from './createClientConfiguration';
import { createConnectionPool } from './createConnectionPool';
import { createPoolConfiguration } from './createPoolConfiguration';
import { type DriverFactory } from '@slonik/driver';
import { createPgDriverFactory } from '@slonik/pg-driver';
import EventEmitter from 'node:events';

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

  const createDriver: DriverFactory =
    clientConfiguration.driverFactory ?? createPgDriverFactory();

  const driver = await createDriver({
    // TODO resolve name conflict between ClientConfiguration and DriverConfiguration
    driverConfiguration: clientConfiguration,
  });

  const events = new EventEmitter() as DatabasePoolEventEmitter;

  const pool = createConnectionPool({
    driver,
    events,
    ...createPoolConfiguration(clientConfiguration),
  });

  return bindPool(
    events,
    Logger.child({
      poolId: pool.id(),
    }),
    pool,
    clientConfiguration,
  );
};
