/* eslint-disable promise/prefer-await-to-then */

import { Logger } from '../Logger.js';
import type { DatabasePoolEventEmitter } from '../types.js';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import type {
  Driver,
  DriverClientEventEmitter,
  DriverClientState,
  DriverQueryOptions,
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
  query: (
    query: string,
    values?: unknown[],
    queryOptions?: DriverQueryOptions,
  ) => Promise<DriverQueryResult>;
  release: () => Promise<void>;
  removeListener: DriverClientEventEmitter['removeListener'];
  state: () => DriverClientState;
  stream: (
    query: string,
    values?: unknown[],
  ) => DriverStream<DriverStreamResult>;
};

type ConnectionMetadata = {
  createdAt: number;
  idleTimer?: ReturnType<typeof setTimeout>;
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
  idleTimeout,
  maximumConnectionAge,
  maximumPoolSize,
  minimumPoolSize,
}: {
  driver: Driver;
  events: DatabasePoolEventEmitter;
  idleTimeout: number;
  /**
   * The maximum age of a connection in milliseconds.
   * After this age, the connection will be destroyed.
   */
  maximumConnectionAge: number;
  maximumPoolSize: number;
  minimumPoolSize: number;
}): ConnectionPool => {
  // See test "waits for all connections to be established before attempting to terminate the pool"
  // for explanation of why `pendingConnections` is needed.
  const pendingConnections = new Set<Promise<ConnectionPoolClient>>();

  const connections = new Set<ConnectionPoolClient>();

  // Track metadata for each connection
  const connectionMetadata = new WeakMap<
    ConnectionPoolClient,
    ConnectionMetadata
  >();

  const waitingClients: WaitingClient[] = [];

  // O(1) idle connection queue - connections are added when released, removed when acquired
  // This avoids O(n) linear search through all connections on every acquire
  // Using both a queue (for FIFO ordering) and a Set (for O(1) membership checks)
  const idleConnectionsQueue: ConnectionPoolClient[] = [];
  const idleConnectionsSet = new Set<ConnectionPoolClient>();

  const id = generateUid();

  let isEnding = false;
  let isEnded = false;

  let poolEndPromise: null | Promise<void> = null;

  const clearIdleTimer = (connection: ConnectionPoolClient) => {
    const metadata = connectionMetadata.get(connection);

    if (metadata?.idleTimer) {
      clearTimeout(metadata.idleTimer);

      metadata.idleTimer = undefined;
    }
  };

  const setIdleTimer = (connection: ConnectionPoolClient) => {
    if (connections.size <= minimumPoolSize) {
      return;
    }

    const metadata = connectionMetadata.get(connection);

    if (!metadata) {
      return;
    }

    clearIdleTimer(connection);

    metadata.idleTimer = setTimeout(async () => {
      if (connection.state() === 'IDLE' && connections.size > minimumPoolSize) {
        logger.debug(
          {
            connectionId: connection.id(),
            idleTimeout,
          },
          'destroying idle connection due to idle timeout',
        );

        try {
          await connection.destroy();
        } catch (error) {
          logger.error(
            {
              connectionId: connection.id(),
              error: serializeError(error),
            },
            'error destroying idle connection',
          );
        }
      }
    }, idleTimeout);
  };

  const isConnectionTooOld = (connection: ConnectionPoolClient): boolean => {
    const metadata = connectionMetadata.get(connection);

    if (!metadata) {
      return false;
    }

    const age = Date.now() - metadata.createdAt;

    return age > maximumConnectionAge;
  };

  const endPool = async () => {
    // Clear all idle timers first
    for (const connection of connections) {
      clearIdleTimer(connection);
    }

    // Clear idle queue
    idleConnectionsQueue.length = 0;
    idleConnectionsSet.clear();

    // Waiting clients are already rejected in end() method

    try {
      await Promise.all(Array.from(pendingConnections));
    } catch (error) {
      logger.error(
        {
          error: serializeError(error),
        },
        'error in pool termination sequence while waiting for pending connections to be established',
      );
    }

    // This is needed to ensure that all pending connections were assigned a waiting client.
    await delay(0);

    // Make a copy of `connections` Set as items are removed from it during the map iteration.
    await Promise.all(
      [...connections].map((connection) => connection.destroy()),
    );

    // Mark as ended after cleanup
    isEnded = true;
  };

  const acquire = async () => {
    return tracer.startActiveSpan('slonik.connection.acquire', async (span) => {
      try {
        span.setAttribute('slonik.pool.id', id);
        span.setAttribute('slonik.pool.connections.total', connections.size);
        span.setAttribute(
          'slonik.pool.connections.pending',
          pendingConnections.size,
        );
        span.setAttribute('slonik.pool.waitingClients', waitingClients.length);
        span.setAttribute('slonik.pool.maximumSize', maximumPoolSize);

        if (isEnded) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: 'Connection pool has ended',
          });

          throw new UnexpectedStateError('Connection pool has ended.');
        }

        if (isEnding) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: 'Connection pool is being terminated',
          });

          throw new UnexpectedStateError(
            'Connection pool is being terminated.',
          );
        }

        const addConnection = async () => {
          const pendingConnection = driver
            .createClient()

            .then((resolvedConnection) => {
              return {
                ...resolvedConnection,
                events,
              };
            });

          pendingConnections.add(pendingConnection);

          const connection = await pendingConnection.catch((error) => {
            pendingConnections.delete(pendingConnection);

            throw error;
          });

          connectionMetadata.set(connection, {
            createdAt: Date.now(),
          });

          const onRelease = () => {
            if (connection.state() !== 'IDLE') {
              return;
            }

            if (isConnectionTooOld(connection)) {
              logger.debug(
                {
                  connectionId: connection.id(),
                  maxAge: maximumConnectionAge,
                },
                'destroying connection due to maximum age',
              );

              connection.destroy().catch((error) => {
                logger.error(
                  {
                    connectionId: connection.id(),
                    error: serializeError(error),
                  },
                  'error destroying old connection',
                );
              });

              return;
            }

            // Don't assign connections to waiting clients if pool is ending
            if (isEnding || isEnded) {
              return;
            }

            const waitingClient = waitingClients.shift();

            if (!waitingClient) {
              // Add to idle queue for O(1) lookup on next acquire
              idleConnectionsQueue.push(connection);
              idleConnectionsSet.add(connection);
              // Set idle timer when connection becomes idle with no waiting clients
              setIdleTimer(connection);
              return;
            }

            // Clear idle timer when connection is being reused
            clearIdleTimer(connection);
            connection.acquire();

            waitingClient.deferred.resolve(connection);
          };

          connection.on('release', onRelease);

          const onDestroy = () => {
            // Clear idle timer when connection is destroyed
            clearIdleTimer(connection);

            connection.removeListener('release', onRelease);
            connection.removeListener('destroy', onDestroy);

            connectionMetadata.delete(connection);

            // Remove from idle queue if present - O(1) operation with Set
            idleConnectionsSet.delete(connection);
            // Note: We don't remove from idleConnectionsQueue array to avoid O(n) indexOf/splice
            // The queue will be cleaned naturally during acquire when we check Set membership

            // O(1) removal from connections Set
            if (!connections.delete(connection)) {
              throw new UnexpectedStateError(
                'Unable to find connection in `connections` Set to remove.',
              );
            }

            // Don't try to fulfill waiting clients if pool is ending
            if (!isEnding && !isEnded) {
              // Try to serve waiting clients by creating new connections or using existing idle ones
              // This is more efficient than recursively calling acquire()
              let createdConnectionForWaitingClient = false;

              if (waitingClients.length > 0) {
                // If we have idle connections, serve from those first
                // Loop to skip destroyed connections (not in Set)
                let idleConnectionToServe: ConnectionPoolClient | undefined;
                while (idleConnectionsQueue.length > 0) {
                  const candidate = idleConnectionsQueue.shift();
                  if (candidate && idleConnectionsSet.has(candidate)) {
                    idleConnectionToServe = candidate;
                    idleConnectionsSet.delete(candidate);
                    break;
                  }
                }

                if (idleConnectionToServe) {
                  const waitingClient = waitingClients.shift();
                  if (waitingClient) {
                    clearIdleTimer(idleConnectionToServe);
                    idleConnectionToServe.acquire();
                    waitingClient.deferred.resolve(idleConnectionToServe);
                  } else {
                    // Put it back if no waiting client (race condition)
                    idleConnectionsQueue.unshift(idleConnectionToServe);
                    idleConnectionsSet.add(idleConnectionToServe);
                  }
                } else if (
                  pendingConnections.size + connections.size <
                  maximumPoolSize
                ) {
                  // Create a new connection for the waiting client
                  const waitingClient = waitingClients.shift();
                  if (waitingClient) {
                    createdConnectionForWaitingClient = true;
                    addConnection().then((newConnection) => {
                      newConnection.acquire();
                      waitingClient.deferred.resolve(newConnection);
                    }, waitingClient.deferred.reject);
                  }
                }
              }

              // In the case that there are no waiting clients and we're below the minimum pool size, add a new connection
              // Don't create if we just created one for a waiting client (it will satisfy minimumPoolSize)
              if (
                !createdConnectionForWaitingClient &&
                connections.size < minimumPoolSize
              ) {
                addConnection().catch((error) => {
                  logger.error(
                    {
                      error: serializeError(error),
                    },
                    'error while adding a new connection to satisfy the minimum pool size',
                  );
                });
              }
            }
          };

          connection.on('destroy', onDestroy);

          connections.add(connection);

          pendingConnections.delete(pendingConnection);

          span.setAttribute('slonik.connection.id', connection.id());
          span.setAttribute('method', 'acquire:add-connection');
          span.setStatus({ code: SpanStatusCode.OK });

          return connection;
        };

        // O(1) lookup: Try to get an idle connection from the queue
        // We iterate through the queue to skip old/destroyed connections, but typically this is just 1-2 iterations
        let idleConnection: ConnectionPoolClient | undefined;

        while (idleConnectionsQueue.length > 0) {
          const connection = idleConnectionsQueue.shift();

          if (!connection) {
            break;
          }

          // Check if connection is still in the Set (not destroyed)
          if (!idleConnectionsSet.has(connection)) {
            // Connection was destroyed, skip it
            continue;
          }

          // Remove from Set now that we're taking it from the queue
          idleConnectionsSet.delete(connection);

          // Double-check state (should always be IDLE, but defensive programming)
          if (connection.state() !== 'IDLE') {
            logger.warn(
              {
                connectionId: connection.id(),
                state: connection.state(),
              },
              'connection in idle queue is not in IDLE state',
            );
            continue;
          }

          clearIdleTimer(connection);

          if (isConnectionTooOld(connection)) {
            logger.debug(
              {
                connectionId: connection.id(),
                maxAge: maximumConnectionAge,
              },
              'destroying old connection from idle queue',
            );

            // Destroy asynchronously, don't block acquire
            connection.destroy().catch((error) => {
              logger.error(
                {
                  connectionId: connection.id(),
                  error: serializeError(error),
                },
                'error destroying old connection during acquire',
              );
            });

            continue;
          }

          // Connection is valid and not too old
          try {
            connection.acquire();
            idleConnection = connection;
            break;
          } catch (error) {
            logger.error(
              {
                connectionId: connection.id(),
                error: serializeError(error),
              },
              'error acquiring connection from idle queue',
            );
            // Try next connection
            continue;
          }
        }

        if (idleConnection) {
          span.setAttribute('slonik.connection.id', idleConnection.id());
          span.setAttribute('method', 'acquire:reuse-idle');
          span.setStatus({ code: SpanStatusCode.OK });

          return idleConnection;
        }

        if (pendingConnections.size + connections.size < maximumPoolSize) {
          const newConnection = await addConnection();

          newConnection.acquire();

          span.setAttribute('slonik.connection.id', newConnection.id());
          span.setAttribute('method', 'acquire:add-connection');
          span.setStatus({ code: SpanStatusCode.OK });

          return newConnection;
        }

        if (isEnding || isEnded) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: 'Connection pool is being terminated',
          });

          throw new UnexpectedStateError(
            'Connection pool is being terminated.',
          );
        }

        const deferred = defer<ConnectionPoolClient>();

        waitingClients.push({
          deferred,
        });

        const queuedAt = process.hrtime.bigint();

        logger.warn(
          {
            connections: connections.size,
            idleConnections: idleConnectionsSet.size,
            maximumPoolSize,
            minimumPoolSize,
            pendingConnections: pendingConnections.size,
            waitingClients: waitingClients.length,
          },
          `connection pool full; client has been queued`,
        );

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

      while (waitingClients.length > 0) {
        const waitingClient = waitingClients.shift();
        if (waitingClient) {
          waitingClient.deferred.reject(
            new Error('Connection pool is being terminated.'),
          );
        }
      }

      if (poolEndPromise) {
        return poolEndPromise;
      }

      poolEndPromise = endPool();

      return poolEndPromise;
    },
    id: () => {
      return id;
    },
    state: () => {
      const state: ConnectionPoolState = {
        acquiredConnections: 0,
        idleConnections: 0,
        pendingConnections: pendingConnections.size,
        pendingDestroyConnections: 0,
        pendingReleaseConnections: 0,
        state: isEnded ? 'ENDED' : isEnding ? 'ENDING' : 'ACTIVE',
        waitingClients: waitingClients.length,
      };

      for (const connection of connections) {
        const connState = connection.state();

        switch (connState) {
          case 'ACQUIRED':
            state.acquiredConnections++;
            break;
          case 'IDLE':
            state.idleConnections++;
            break;
          case 'PENDING_DESTROY':
            state.pendingDestroyConnections++;
            break;
          case 'PENDING_RELEASE':
            state.pendingReleaseConnections++;
            break;
        }
      }

      return state;
    },
  };
};
