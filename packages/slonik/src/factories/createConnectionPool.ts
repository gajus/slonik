import { Logger } from '../Logger';
import {
  type Driver,
  type DriverClientEventEmitter,
  type DriverClientState,
  type DriverQueryResult,
  type DriverStream,
  type DriverStreamResult,
} from '@slonik/driver';
import { defer, type DeferredPromise, generateUid } from '@slonik/utilities';
import { setTimeout as delay } from 'node:timers/promises';
import { serializeError } from 'serialize-error';

const logger = Logger.child({
  namespace: 'createConnectionPool',
});

export type ConnectionPoolClient = {
  acquire: () => void;
  destroy: () => Promise<void>;
  id: () => string;
  off: DriverClientEventEmitter['off'];
  on: DriverClientEventEmitter['on'];
  query: (query: string, values?: unknown[]) => Promise<DriverQueryResult>;
  release: () => Promise<void>;
  removeListener: DriverClientEventEmitter['removeListener'];
  state: () => DriverClientState;
  stream: (
    query: string,
    values?: unknown[],
  ) => DriverStream<DriverStreamResult>;
};

type WaitingClient = {
  deferred: DeferredPromise<ConnectionPoolClient>;
};

type ConnectionPoolStateName = 'ACTIVE' | 'ENDING' | 'ENDED';

/**
 * @property {number} acquiredConnections - The number of connections that are currently acquired.
 */
type ConnectionPoolState = {
  acquiredConnections: number;
  idleConnections: number;
  pendingDestroyConnections: number;
  pendingReleaseConnections: number;
  state: ConnectionPoolStateName;
  waitingClients: number;
};

export type ConnectionPool = {
  acquire: () => Promise<ConnectionPoolClient>;
  end: () => Promise<void>;
  id: () => string;
  state: () => ConnectionPoolState;
};

export const createConnectionPool = ({
  driver,
  poolSize = 1,
}: {
  driver: Driver;
  idleTimeout?: number;
  poolSize?: number;
}): ConnectionPool => {
  // See test "waits for all connections to be established before attempting to terminate the pool"
  // for explanation of why `pendingConnections` is needed.
  const pendingConnections: Array<Promise<ConnectionPoolClient>> = [];

  const connections: ConnectionPoolClient[] = [];

  const waitingClients: WaitingClient[] = [];

  const id = generateUid();

  let isEnding = false;
  let isEnded = false;

  let poolEndPromise: Promise<void> | null = null;

  const endPool = async () => {
    try {
      await Promise.all(pendingConnections);
    } catch (error) {
      logger.error(
        {
          error: serializeError(error),
        },
        'error in pool termination sequence while waiting for pending connections to be established',
      );
    }

    try {
      await Promise.all(
        waitingClients.map((waitingClient) => waitingClient.deferred.promise),
      );
    } catch (error) {
      logger.error(
        {
          error: serializeError(error),
        },
        'error in pool termination sequence while waiting for waiting clients to be resolved',
      );
    }

    // This is needed to ensure that all pending connections were assigned a waiting client.
    // e.g. "waits for all connections to be established before attempting to terminate the pool" test
    await delay(0);

    // Make a copy of `connections` array as items are removed from it during the map iteration.
    // If `connections` array is used directly, the loop will skip some items.
    await Promise.all(
      [...connections].map((connection) => connection.destroy()),
    );
  };

  const acquire = async () => {
    if (isEnding) {
      throw new Error('Connection pool is being terminated.');
    }

    if (isEnded) {
      throw new Error('Connection pool has ended.');
    }

    const idleConnection = connections.find(
      (connection) => connection.state() === 'IDLE',
    );

    if (idleConnection) {
      idleConnection.acquire();

      return idleConnection;
    }

    if (pendingConnections.length + connections.length < poolSize) {
      const pendingConnection = driver.createClient();

      pendingConnections.push(pendingConnection);

      const connection = await pendingConnection.catch((error) => {
        pendingConnections.pop();
        throw error;
      });

      const onRelease = () => {
        const waitingClient = waitingClients.shift();

        if (!waitingClient) {
          return;
        }

        if (connection.state() !== 'IDLE') {
          throw new Error('Connection is not idle.');
        }

        connection.acquire();

        waitingClient.deferred.resolve(connection);
      };

      connection.on('release', onRelease);

      const onDestroy = () => {
        connection.removeListener('release', onRelease);
        connection.removeListener('destroy', onDestroy);

        connections.splice(connections.indexOf(connection), 1);

        const waitingClient = waitingClients.shift();

        if (!waitingClient) {
          return;
        }

        // eslint-disable-next-line promise/prefer-await-to-then
        acquire().then(
          waitingClient.deferred.resolve,
          waitingClient.deferred.reject,
        );
      };

      connection.on('destroy', onDestroy);

      connection.acquire();

      connections.push(connection);

      pendingConnections.splice(
        pendingConnections.indexOf(pendingConnection),
        1,
      );

      return connection;
    } else {
      const deferred = defer<ConnectionPoolClient>();

      waitingClients.push({
        deferred,
      });

      const queuedAt = process.hrtime.bigint();

      logger.warn(
        {
          connections: connections.length,
          pendingConnections: pendingConnections.length,
          poolSize,
          waitingClients: waitingClients.length,
        },
        `connection pool full; client has been queued`,
      );

      // eslint-disable-next-line promise/prefer-await-to-then
      return deferred.promise.then((connection) => {
        logger.debug(
          {
            connectionId: connection.id(),
            duration: Number(process.hrtime.bigint() - queuedAt) / 1e6,
          },
          'connection has been acquired from the queue',
        );

        return connection;
      });
    }
  };

  return {
    acquire,
    end: async () => {
      isEnding = true;

      if (poolEndPromise) {
        return poolEndPromise;
      }

      poolEndPromise = endPool();

      isEnded = true;

      return poolEndPromise;
    },
    id: () => {
      return id;
    },
    state: () => {
      const stateName = isEnded ? 'ENDED' : isEnding ? 'ENDING' : 'ACTIVE';

      const state = {
        acquiredConnections: 0,
        idleConnections: 0,
        pendingDestroyConnections: 0,
        pendingReleaseConnections: 0,
      };

      // TODO add pendingAcquireConnections
      // TODO add destroyedConnections

      for (const connection of connections) {
        if (connection.state() === 'ACQUIRED') {
          state.acquiredConnections++;
        }

        if (connection.state() === 'IDLE') {
          state.idleConnections++;
        }

        if (connection.state() === 'PENDING_RELEASE') {
          state.pendingReleaseConnections++;
        }

        if (connection.state() === 'PENDING_DESTROY') {
          state.pendingDestroyConnections++;
        }

        if (connection.state() === 'DESTROYED') {
          state.pendingReleaseConnections++;
        }
      }

      return {
        ...state,
        state: stateName,
        waitingClients: waitingClients.length,
      };
    },
  };
};
