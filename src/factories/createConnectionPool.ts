import { type ClientConfiguration } from '../types';
import { defer, type DeferredPromise } from '../utilities/defer';
import { randomUUID } from 'node:crypto';
import EventEmitter from 'node:events';
import { type StrictEventEmitter } from 'strict-event-emitter-types';

export type Notice = {
  message: string;
};

type ClientEventEmitter = StrictEventEmitter<
  EventEmitter,
  {
    acquire: () => void;
    destroy: () => void;
    error: (error: Error) => void;
    notice: (event: Notice) => void;
    release: () => void;
  }
>;

export type ConnectionPoolClientFactory = ({
  clientConfiguration,
}: {
  clientConfiguration: ClientConfiguration;
}) => Promise<ConnectionPoolClient>;

type QueryResult = {
  rows: Array<Record<string, unknown>>;
};

// TODO handle destroy
export type ConnectionPoolClient = {
  acquire: () => ConnectionPoolClient;
  destroy: () => Promise<void>;
  id: string;
  isActive: () => boolean;
  isIdle: () => boolean;
  off: ClientEventEmitter['off'];
  on: ClientEventEmitter['on'];
  query: (query: string, values: unknown[]) => Promise<QueryResult>;
  release: () => Promise<void>;
  removeListener: ClientEventEmitter['removeListener'];
};

/**
 * @property {Function} connect - Connect to the database. The client must not be used before this method is called.
 * @property {Function} end - Disconnect from the database. The client must not be used after this method is called.
 * @property {Function} query - Execute a SQL query.
 */
type InternalPoolClient = {
  connect: () => Promise<void>;
  end: () => Promise<void>;
  query: (query: string, values: unknown[]) => Promise<QueryResult>;
};

type InternalPoolClientFactorySetup = ({
  eventEmitter,
  clientConfiguration,
}: {
  clientConfiguration: ClientConfiguration;
  eventEmitter: ClientEventEmitter;
}) => Promise<InternalPoolClientFactory>;

type InternalPoolClientFactory = () => InternalPoolClient;

export const createPoolClientFactory = (
  setup: InternalPoolClientFactorySetup,
): ConnectionPoolClientFactory => {
  const eventEmitter = new EventEmitter();

  return async ({ clientConfiguration }) => {
    const createPoolClient = await setup({
      clientConfiguration,
      eventEmitter,
    });

    const { query, connect, end } = createPoolClient();

    let isActive = false;
    let isDestroyed = false;
    let idleTimeout: NodeJS.Timeout | null = null;

    let activeQueryPromise: Promise<QueryResult> | null = null;

    const id = randomUUID();

    const clearIdleTimeout = () => {
      if (idleTimeout) {
        clearTimeout(idleTimeout);

        idleTimeout = null;
      }
    };

    const client = {
      acquire: () => {
        if (isDestroyed) {
          throw new Error('Client is destroyed.');
        }

        if (isActive) {
          throw new Error('Client is already acquired.');
        }

        clearIdleTimeout();

        isActive = true;

        eventEmitter.emit('acquire');

        return client;
      },
      destroy: async () => {
        if (isDestroyed) {
          return;
        }

        clearIdleTimeout();

        isDestroyed = true;

        eventEmitter.emit('destroy');

        await end();
      },
      id,
      isActive: () => isActive,
      isIdle: () => {
        return !isActive;
      },
      off: eventEmitter.off.bind(eventEmitter),
      on: eventEmitter.on.bind(eventEmitter),
      query: async (sql, values) => {
        if (isDestroyed) {
          throw new Error('Client is destroyed.');
        }

        if (!isActive) {
          throw new Error('Client is not active.');
        }

        try {
          activeQueryPromise = query(sql, values);

          const result = await activeQueryPromise;

          // eslint-disable-next-line require-atomic-updates
          activeQueryPromise = null;

          return result;
        } catch (error) {
          eventEmitter.emit('error', error);

          throw error;
        }
      },
      release: async () => {
        if (activeQueryPromise) {
          throw new Error(
            'Cannot release client while there is an active query.',
          );
        }

        if (!isActive) {
          return;
        }

        isActive = false;

        if (clientConfiguration.idleTimeout !== 'DISABLE_TIMEOUT') {
          clearIdleTimeout();

          idleTimeout = setTimeout(() => {
            void client.destroy();

            idleTimeout = null;
          }, clientConfiguration.idleTimeout).unref();
        }

        eventEmitter.emit('release');
      },
      removeListener: eventEmitter.removeListener.bind(eventEmitter),
    };

    await connect();

    return client;
  };
};

export type ConnectionPool = {
  acquire: () => Promise<ConnectionPoolClient>;
  end: () => Promise<void>;
  id: () => string;
  state: () => {
    activeConnections: number;
    ended: boolean;
    idleConnections: number;
    waitingClients: number;
  };
};

export const createConnectionPool = ({
  clientConfiguration,
  createClient,
  poolSize = 1,
}: {
  clientConfiguration: ClientConfiguration;
  createClient: ConnectionPoolClientFactory;
  idleTimeout?: number;
  poolSize?: number;
}): ConnectionPool => {
  const connections: ConnectionPoolClient[] = [];
  const waitingClients: Array<DeferredPromise<ConnectionPoolClient>> = [];

  const id = randomUUID();

  let isEnded = false;

  return {
    acquire: async () => {
      if (isEnded) {
        throw new Error('Connection pool has ended.');
      }

      // const idleConnection = connections.find((connection) =>
      //   connection.isIdle(),
      // );

      // if (idleConnection) {
      //   return idleConnection.acquire();
      // }

      if (connections.length < poolSize) {
        const connection = await createClient({
          clientConfiguration,
        });

        const onRelease = () => {
          if (!waitingClients.length) {
            return;
          }

          if (connection.isActive()) {
            // The connection was used by another client.
            return;
          }

          const waitingClient = waitingClients.shift();

          if (!waitingClient) {
            return;
          }

          waitingClient.resolve(connection.acquire());
        };

        connection.on('release', onRelease);

        const onDestroy = () => {
          connection.removeListener('release', onRelease);
          connection.removeListener('destroy', onDestroy);

          connections.splice(connections.indexOf(connection), 1);
        };

        connection.on('destroy', onDestroy);

        connections.push(connection);

        return connection.acquire();
      } else {
        const waitingClient = defer<ConnectionPoolClient>();

        waitingClients.push(waitingClient);

        return waitingClient.promise;
      }
    },
    end: async () => {
      if (isEnded) {
        return;
      }

      isEnded = true;

      await Promise.all(connections.map((connection) => connection.release()));

      await Promise.all(connections.map((connection) => connection.destroy()));
    },
    id: () => {
      return id;
    },
    state: () => {
      const idleConnections = connections.filter((connection) =>
        connection.isIdle(),
      );

      return {
        activeConnections: connections.length - idleConnections.length,
        ended: isEnded,
        idleConnections: idleConnections.length,
        waitingClients: waitingClients.length,
      };
    },
  };
};
