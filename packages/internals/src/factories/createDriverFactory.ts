import { Logger } from '../Logger';
import { type TypedReadable, type TypeParser } from '../types';
import { createUid } from '../utilities/createUid';
import EventEmitter from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { type ConnectionOptions as TlsConnectionOptions } from 'node:tls';
import { serializeError } from 'serialize-error';
import { type StrictEventEmitter } from 'strict-event-emitter-types';

export type DriverConfiguration = {
  readonly connectionTimeout: number | 'DISABLE_TIMEOUT';
  readonly connectionUri: string;
  readonly gracefulTerminationTimeout?: number;
  readonly idleInTransactionSessionTimeout: number | 'DISABLE_TIMEOUT';
  readonly idleTimeout?: number | 'DISABLE_TIMEOUT';
  readonly maximumPoolSize?: number;
  readonly ssl?: TlsConnectionOptions;
  readonly statementTimeout: number | 'DISABLE_TIMEOUT';
  readonly typeParsers: readonly TypeParser[];
};

export type DriverNotice = {
  message: string;
};

export type DriverEventEmitter = StrictEventEmitter<
  EventEmitter,
  {
    error: (error: Error) => void;
  }
>;

export type DriverClientEventEmitter = StrictEventEmitter<
  EventEmitter,
  {
    acquire: () => void;
    destroy: () => void;
    error: (error: Error) => void;
    notice: (event: DriverNotice) => void;
    release: () => void;
  }
>;

export type DriverClientState =
  | 'ACQUIRED'
  | 'DESTROYED'
  | 'IDLE'
  | 'PENDING_DESTROY'
  | 'PENDING_RELEASE';

export type DriverClient = {
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

export type Driver = {
  createClient: () => Promise<DriverClient>;
};

export type DriverFactory = ({
  driverConfiguration,
}: {
  driverConfiguration: DriverConfiguration;
}) => Promise<Driver>;

type DriverField = {
  dataTypeId: number;
  name: string;
};

export type DriverCommand = 'COPY' | 'DELETE' | 'INSERT' | 'SELECT' | 'UPDATE';

export type DriverQueryResult = {
  readonly command: DriverCommand;
  readonly fields: DriverField[];
  readonly rowCount: number | null;
  readonly rows: Array<Record<string, unknown>>;
};

export type DriverStreamResult = {
  readonly fields: DriverField[];
  readonly row: Record<string, unknown>;
};

type DriverSetup = ({
  driverEventEmitter,
  driverConfiguration,
}: {
  driverConfiguration: DriverConfiguration;
  driverEventEmitter: DriverEventEmitter;
}) => Promise<InternalPoolClientFactory>;

/**
 * @property {Function} connect - Connect to the database. The client must not be used before this method is called.
 * @property {Function} end - Disconnect from the database. The client must not be used after this method is called.
 * @property {Function} query - Execute a SQL query.
 */
type InternalPoolClient = {
  connect: () => Promise<void>;
  end: () => Promise<void>;
  query: (query: string, values?: unknown[]) => Promise<DriverQueryResult>;
  stream: (
    query: string,
    values?: unknown[],
  ) => TypedReadable<DriverStreamResult>;
};

type InternalPoolClientFactory = {
  createPoolClient: ({
    clientEventEmitter,
  }: {
    clientEventEmitter: DriverClientEventEmitter;
  }) => Promise<InternalPoolClient>;
};

export const createDriverFactory = (setup: DriverSetup): DriverFactory => {
  return async ({ driverConfiguration }): Promise<Driver> => {
    const driverEventEmitter: DriverEventEmitter = new EventEmitter();

    const { createPoolClient } = await setup({
      driverConfiguration,
      driverEventEmitter,
    });

    return {
      createClient: async () => {
        const clientEventEmitter: DriverClientEventEmitter = new EventEmitter();

        // eslint-disable-next-line prefer-const
        let destroy: () => Promise<void>;

        const onError = (error: Error) => {
          if (destroy) {
            // eslint-disable-next-line promise/prefer-await-to-then
            void destroy().catch(() => {
              // Do nothing. The error has been emitted already.
              // See "handles unexpected backend termination" test.
            });
          }

          Logger.warn(
            {
              error: serializeError(error),
              namespace: 'driverClient',
            },
            'unhandled driver client error',
          );
        };

        clientEventEmitter.on('error', onError);

        const { query, stream, connect, end } = await createPoolClient({
          clientEventEmitter,
        });

        let isAcquired = false;
        let isDestroyed = false;
        let idleTimeout: NodeJS.Timeout | null = null;

        let activeQueryPromise: Promise<DriverQueryResult> | null = null;
        let destroyPromise: Promise<void> | null = null;
        let releasePromise: Promise<void> | null = null;

        const id = createUid();

        const clearIdleTimeout = () => {
          if (idleTimeout) {
            clearTimeout(idleTimeout);

            idleTimeout = null;
          }
        };

        const state = () => {
          if (destroyPromise) {
            return 'PENDING_DESTROY';
          }

          if (releasePromise) {
            return 'PENDING_RELEASE';
          }

          if (isDestroyed) {
            return 'DESTROYED';
          }

          if (isAcquired) {
            return 'ACQUIRED';
          }

          return 'IDLE';
        };

        const internalDestroy = async () => {
          const currentState = state();

          if (currentState === 'PENDING_DESTROY') {
            throw new Error('Client is pending destroy.');
          }

          if (currentState === 'DESTROYED') {
            throw new Error('Client is destroyed.');
          }

          clearIdleTimeout();

          if (activeQueryPromise) {
            await Promise.race([
              delay(driverConfiguration.gracefulTerminationTimeout),
              activeQueryPromise,
            ]);
          }

          isDestroyed = true;

          clientEventEmitter.emit('destroy');

          await end();

          clientEventEmitter.off('error', onError);
        };

        destroy = async () => {
          if (destroyPromise) {
            return destroyPromise;
          }

          destroyPromise = internalDestroy();

          return destroyPromise;
        };

        const internalRelease = async () => {
          const currentState = state();

          if (currentState === 'PENDING_DESTROY') {
            throw new Error('Client is pending destroy.');
          }

          if (currentState === 'DESTROYED') {
            throw new Error('Client is destroyed.');
          }

          if (currentState !== 'ACQUIRED') {
            throw new Error('Client is not acquired.');
          }

          if (activeQueryPromise) {
            throw new Error('Client has an active query.');
          }

          await query('DISCARD ALL');

          if (driverConfiguration.idleTimeout !== 'DISABLE_TIMEOUT') {
            clearIdleTimeout();

            idleTimeout = setTimeout(() => {
              void destroy();

              idleTimeout = null;
            }, driverConfiguration.idleTimeout).unref();
          }

          // eslint-disable-next-line require-atomic-updates
          isAcquired = false;

          releasePromise = null;

          clientEventEmitter.emit('release');
        };

        const release = () => {
          if (destroyPromise) {
            return destroyPromise;
          }

          if (releasePromise) {
            return releasePromise;
          }

          releasePromise = internalRelease();

          return releasePromise;
        };

        const client = {
          acquire: () => {
            const currentState = state();

            if (currentState === 'PENDING_DESTROY') {
              throw new Error('Client is pending destroy.');
            }

            if (currentState === 'PENDING_RELEASE') {
              throw new Error('Client is pending release.');
            }

            if (currentState === 'DESTROYED') {
              throw new Error('Client is destroyed.');
            }

            if (currentState === 'ACQUIRED') {
              throw new Error('Client is already acquired.');
            }

            clearIdleTimeout();

            isAcquired = true;

            clientEventEmitter.emit('acquire');
          },
          destroy,
          id: () => id,
          off: (event, listener) => {
            return clientEventEmitter.off(event, listener);
          },
          on: (event, listener) => {
            return clientEventEmitter.on(event, listener);
          },
          query: async (sql, values) => {
            const currentState = state();

            if (currentState === 'PENDING_DESTROY') {
              throw new Error('Client is pending destroy.');
            }

            if (currentState === 'PENDING_RELEASE') {
              throw new Error('Client is pending release.');
            }

            if (currentState === 'DESTROYED') {
              throw new Error('Client is destroyed.');
            }

            if (currentState !== 'ACQUIRED') {
              throw new Error('Client is not acquired.');
            }

            try {
              activeQueryPromise = query(sql, values);

              const result = await activeQueryPromise;

              if (!activeQueryPromise) {
                throw new Error('Expected `activeQueryPromise` to be set.');
              }

              return result;
            } finally {
              // eslint-disable-next-line require-atomic-updates
              activeQueryPromise = null;
            }
          },
          release,
          removeListener: (event, listener) => {
            return clientEventEmitter.removeListener(event, listener);
          },
          state,
          stream: (sql, values) => {
            const currentState = state();

            if (currentState === 'PENDING_DESTROY') {
              throw new Error('Client is pending destroy.');
            }

            if (currentState === 'PENDING_RELEASE') {
              throw new Error('Client is pending release.');
            }

            if (currentState === 'DESTROYED') {
              throw new Error('Client is destroyed.');
            }

            if (currentState !== 'ACQUIRED') {
              throw new Error('Client is not acquired.');
            }

            // TODO determine if streaming and do not allow to release the client until the stream is finished

            return stream(sql, values);
          },
        };

        await connect();

        return client;
      },
    };
  };
};
