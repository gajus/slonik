import { type ConnectionPoolClient } from '../factories/createConnectionPool';
import { createPool } from '../factories/createPool';
import { type ClientConfigurationInput } from '../types';
import * as sinon from 'sinon';

export const createPoolWithMockedQuery = async (
  dsn: string,
  { driverFactory, ...configuration }: ClientConfigurationInput,
) => {
  const query = sinon.mock();

  let connection: ConnectionPoolClient;

  const pool = await createPool(dsn, {
    driverFactory: async (...args) => {
      if (!driverFactory) {
        throw new Error('Driver is required');
      }

      const driver = await driverFactory(...args);

      return {
        createClient: async () => {
          if (connection) {
            return connection;
          }

          // We are re-using the same connection for all queries
          // as it makes it easier to spy on the connection.
          // eslint-disable-next-line require-atomic-updates
          connection = await driver.createClient();

          // eslint-disable-next-line require-atomic-updates
          connection.query = query;

          return connection;
        },
      };
    },
    ...configuration,
  });

  return {
    pool,
    query,
  };
};
