import { type ConnectionPoolClient } from '../factories/createConnectionPool';
import { createPool } from '../factories/createPool';
import { type ClientConfigurationInput } from '../types';
import * as sinon from 'sinon';

export const createPoolWithMockedQuery = async (
  dsn: string,
  { driver, ...configuration }: ClientConfigurationInput,
) => {
  const query = sinon.mock();

  let connection: ConnectionPoolClient;

  const pool = await createPool(dsn, {
    driver: async (...args) => {
      if (connection) {
        return connection;
      }

      if (!driver) {
        throw new Error('Driver is required');
      }

      // We are re-using the same connection for all queries
      // as it makes it easier to spy on the connection.
      // eslint-disable-next-line require-atomic-updates
      connection = await driver(...args);

      // eslint-disable-next-line require-atomic-updates
      connection.query = query;

      return connection;
    },
    ...configuration,
  });

  return {
    pool,
    query,
  };
};
