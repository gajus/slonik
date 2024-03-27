import { type ConnectionPoolClient } from '../factories/createConnectionPool';
import { createPool } from '../factories/createPool';
import { type ClientConfigurationInput } from '../types';
import * as sinon from 'sinon';

export const createPoolWithSpy = async (
  dsn: string,
  { client, ...configuration }: ClientConfigurationInput,
) => {
  const spy = {
    acquire: sinon.spy(),
    destroy: sinon.spy(),
    query: sinon.spy(),
    release: sinon.spy(),
  };

  let connection: ConnectionPoolClient;

  const pool = await createPool(dsn, {
    client: async (...args) => {
      if (connection) {
        return connection;
      }

      if (!client) {
        throw new Error('Client is required');
      }

      // We are re-using the same connection for all queries
      // as it makes it easier to spy on the connection.
      // eslint-disable-next-line require-atomic-updates
      connection = await client(...args);

      spy.acquire = sinon.spy(connection, 'acquire');
      spy.destroy = sinon.spy(connection, 'destroy');
      spy.query = sinon.spy(connection, 'query');
      spy.release = sinon.spy(connection, 'release');

      return connection;
    },
    ...configuration,
  });

  return {
    pool,
    spy,
  };
};
