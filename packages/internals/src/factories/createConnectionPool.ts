import { Logger } from '../Logger';
import { type TypedReadable } from '../types';
import { createUid } from '../utilities/createUid';
import { defer, type DeferredPromise } from '../utilities/defer';
import {
  type Driver,
  type DriverClientEventEmitter,
  type DriverClientState,
  type DriverQueryResult,
  type DriverStreamResult,
} from './createDriverFactory';
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
  ) => TypedReadable<DriverStreamResult>;
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

  const waitingClients: Array<DeferredPromise<ConnectionPoolClient>> = [];

  const id = createUid();

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

    // This is needed to ensure that all pending connections were assigned a waiting client.
    // e.g. "waits for all connections to be established before attempting to terminate the pool" test
    await delay(0);

    await Promise.all(connections.map((connection) => connection.destroy()));
  };

  return {
    acquire: async () => {
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

        const connection = await pendingConnection;

        const onRelease = () => {
          const waitingClient = waitingClients.shift();

          if (!waitingClient) {
            return;
          }

          if (connection.state() !== 'IDLE') {
            throw new Error('Connection is not idle.');
          }

          connection.acquire();

          waitingClient.resolve(connection);
        };

        connection.on('release', onRelease);

        const onDestroy = () => {
          connection.removeListener('release', onRelease);
          connection.removeListener('destroy', onDestroy);

          connections.splice(connections.indexOf(connection), 1);
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
        const waitingClient = defer<ConnectionPoolClient>();

        waitingClients.push(waitingClient);

        return waitingClient.promise;
      }
    },
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
