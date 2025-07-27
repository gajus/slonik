import { Logger } from '../Logger.js';
import type { DatabasePoolEventEmitter } from '../types.js';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import type {
  Driver,
  DriverClientEventEmitter,
  DriverClientState,
  DriverQueryResult,
  DriverStream,
  DriverStreamResult,
} from '@slonik/driver';
import { UnexpectedStateError } from '@slonik/errors';
import { defer, generateUid } from '@slonik/utilities';
import type { DeferredPromise } from '@slonik/utilities';
import { setTimeout as delay } from 'node:timers/promises';
import { serializeError } from 'serialize-error';

const tracer = trace.getTracer('pg-slonik-connection-pool');

const logger = Logger.child({
  namespace: 'createConnectionPool',
});

export type ConnectionPool = {
  acquire: () => Promise<ConnectionPoolClient>;
  end: () => Promise<void>;
  id: () => string;
  state: () => ConnectionPoolState;
};

export type ConnectionPoolClient = {
  acquire: () => void;
  destroy: () => Promise<void>;
  events: DatabasePoolEventEmitter;
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

/**
 * @property {number} acquiredConnections - The number of connections that are currently acquired.
 */
type ConnectionPoolState = {
  acquiredConnections: number;
  idleConnections: number;
  pendingConnections: number;
  pendingDestroyConnections: number;
  pendingReleaseConnections: number;
  state: ConnectionPoolStateName;
  waitingClients: number;
};

type ConnectionPoolStateName = 'ACTIVE' | 'ENDED' | 'ENDING';

type WaitingClient = {
  deferred: DeferredPromise<ConnectionPoolClient>;
};

export const createConnectionPool = ({
  driver,
  events,
  maximumPoolSize,
  minimumPoolSize,
}: {
  driver: Driver;
  events: DatabasePoolEventEmitter;
  idleTimeout: number;
  maximumPoolSize: number;
  minimumPoolSize: number;
}): ConnectionPool => {
  // See test "waits for all connections to be established before attempting to terminate the pool"
  // for explanation of why `pendingConnections` is needed.
  const pendingConnections: Array<Promise<ConnectionPoolClient>> = [];

  const connections: ConnectionPoolClient[] = [];

  const waitingClients: WaitingClient[] = [];

  const id = generateUid();

  let isEnding = false;
  let isEnded = false;

  let poolEndPromise: null | Promise<void> = null;

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
    return tracer.startActiveSpan('slonik.connection.acquire', async (span) => {
      try {
        span.setAttribute('slonik.pool.id', id);
        span.setAttribute('slonik.pool.connections.total', connections.length);
        span.setAttribute(
          'slonik.pool.connections.pending',
          pendingConnections.length,
        );
        span.setAttribute('slonik.pool.waitingClients', waitingClients.length);
        span.setAttribute('slonik.pool.maximumSize', maximumPoolSize);

        if (isEnding) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: 'Connection pool is being terminated',
          });

          throw new Error('Connection pool is being terminated.');
        }

        if (isEnded) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: 'Connection pool has ended',
          });

          throw new Error('Connection pool has ended.');
        }

        const addConnection = async () => {
          const pendingConnection = driver
            .createClient()
            // eslint-disable-next-line promise/prefer-await-to-then
            .then((resolvedConnection) => {
              return {
                ...resolvedConnection,
                events,
              };
            });

          pendingConnections.push(pendingConnection);

          const connection = await pendingConnection.catch((error) => {
            const index = pendingConnections.indexOf(pendingConnection);

            if (index === -1) {
              logger.error(
                'Unable to find pendingConnection in `pendingConnections` array to remove.',
              );
            } else {
              pendingConnections.splice(index, 1);
            }

            throw error;
          });

          const onRelease = () => {
            if (connection.state() !== 'IDLE') {
              return;
            }

            const waitingClient = waitingClients.shift();

            if (!waitingClient) {
              return;
            }

            connection.acquire();

            waitingClient.deferred.resolve(connection);
          };

          connection.on('release', onRelease);

          const onDestroy = () => {
            connection.removeListener('release', onRelease);
            connection.removeListener('destroy', onDestroy);

            const indexOfConnection = connections.indexOf(connection);

            if (indexOfConnection === -1) {
              throw new UnexpectedStateError(
                'Unable to find connection in `connections` array to remove.',
              );
            } else {
              connections.splice(indexOfConnection, 1);
            }

            const waitingClient = waitingClients.shift();

            if (waitingClient) {
              // eslint-disable-next-line promise/prefer-await-to-then
              acquire().then(
                waitingClient.deferred.resolve,
                waitingClient.deferred.reject,
              );

              return;
            }

            // In the case that there are no waiting clients and we're below the minimum pool size, add a new connection
            if (!isEnding && !isEnded && connections.length < minimumPoolSize) {
              // eslint-disable-next-line promise/prefer-await-to-then
              addConnection().catch((error) => {
                logger.error(
                  {
                    error: serializeError(error),
                  },
                  'error while adding a new connection to satisfy the minimum pool size',
                );
              });
            }
          };

          connection.on('destroy', onDestroy);

          connections.push(connection);

          const indexOfPendingConnection =
            pendingConnections.indexOf(pendingConnection);

          if (indexOfPendingConnection === -1) {
            logger.error(
              'Unable to find pendingConnection in `pendingConnections` array to remove.',
            );
          } else {
            pendingConnections.splice(indexOfPendingConnection, 1);
          }

          span.setAttribute('slonik.connection.id', connection.id());
          span.setAttribute('method', 'acquire:add-connection');
          span.setStatus({ code: SpanStatusCode.OK });

          return connection;
        };

        const idleConnection = connections.find(
          (connection) => connection.state() === 'IDLE',
        );

        if (idleConnection) {
          idleConnection.acquire();

          span.setAttribute('slonik.connection.id', idleConnection.id());
          span.setAttribute('method', 'acquire:reuse-idle');
          span.setStatus({ code: SpanStatusCode.OK });

          return idleConnection;
        }

        if (pendingConnections.length + connections.length < maximumPoolSize) {
          const newConnection = await addConnection();

          newConnection.acquire();

          span.setAttribute('slonik.connection.id', newConnection.id());
          span.setAttribute('method', 'acquire:add-connection');
          span.setStatus({ code: SpanStatusCode.OK });

          return newConnection;
        }

        const deferred = defer<ConnectionPoolClient>();

        waitingClients.push({
          deferred,
        });

        const queuedAt = process.hrtime.bigint();

        logger.warn(
          {
            connections: connections.length,
            maximumPoolSize,
            minimumPoolSize,
            pendingConnections: pendingConnections.length,
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

          span.setAttribute(
            'queuedMs',
            Number(process.hrtime.bigint() - queuedAt) / 1e6,
          );
          span.setAttribute('slonik.connection.id', connection.id());
          span.setAttribute('method', 'acquire:queued');
          span.setStatus({ code: SpanStatusCode.OK });

          return connection;
        });
      } catch (error) {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : String(error),
        });

        throw error;
      } finally {
        span.end();
      }
    });
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
        pendingConnections: pendingConnections.length,
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
