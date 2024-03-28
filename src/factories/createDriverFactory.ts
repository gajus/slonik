import { type TypedReadable, type TypeParser } from '../types';
import { createUid } from '../utilities/createUid';
import EventEmitter from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { type ConnectionOptions as TlsConnectionOptions } from 'node:tls';
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

export type ClientEventEmitter = StrictEventEmitter<
  EventEmitter,
  {
    acquire: () => void;
    destroy: () => void;
    error: (error: Error) => void;
    notice: (event: DriverNotice) => void;
    release: () => void;
  }
>;

export type DriverClient = {
  acquire: () => void;
  destroy: () => Promise<void>;
  id: () => string;
  isActive: () => boolean;
  isIdle: () => boolean;
  off: ClientEventEmitter['off'];
  on: ClientEventEmitter['on'];
  query: (query: string, values?: unknown[]) => Promise<DriverQueryResult>;
  release: () => Promise<void>;
  removeListener: ClientEventEmitter['removeListener'];
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
    clientEventEmitter: ClientEventEmitter;
  }) => Promise<InternalPoolClient>;
};

export const createDriverFactory = (setup: DriverSetup): DriverFactory => {
  return async ({ driverConfiguration }): Promise<Driver> => {
    const driverEventEmitter: DriverEventEmitter = new EventEmitter();

    driverEventEmitter.on('error', () => {
      // TODO I am not clear why this is needed given that `raceError` in `createConnection` is already listening for errors on the connection object.
    });

    const { createPoolClient } = await setup({
      driverConfiguration,
      driverEventEmitter,
    });

    return {
      createClient: async () => {
        const clientEventEmitter: ClientEventEmitter = new EventEmitter();

        const { query, stream, connect, end } = await createPoolClient({
          clientEventEmitter,
        });

        let isActive = false;
        let isDestroyed = false;
        let idleTimeout: NodeJS.Timeout | null = null;

        let activeQueryPromise: Promise<DriverQueryResult> | null = null;

        const id = createUid();

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

            clientEventEmitter.emit('acquire');
          },
          destroy: async () => {
            if (activeQueryPromise) {
              await Promise.race([
                delay(driverConfiguration.gracefulTerminationTimeout),
                activeQueryPromise,
              ]);
            }

            if (isDestroyed) {
              return;
            }

            clearIdleTimeout();

            isDestroyed = true;

            clientEventEmitter.emit('destroy');

            await end();
          },
          id: () => id,
          isActive: () => isActive,
          isIdle: () => {
            return !isActive;
          },
          off: (event, listener) => {
            return clientEventEmitter.off(event, listener);
          },
          on: (event, listener) => {
            return clientEventEmitter.on(event, listener);
          },
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

              if (!activeQueryPromise) {
                throw new Error('Expected `activeQueryPromise` to be set.');
              }

              return result;
            } finally {
              // eslint-disable-next-line require-atomic-updates
              activeQueryPromise = null;
            }
          },
          release: async () => {
            if (activeQueryPromise) {
              await Promise.race([
                delay(driverConfiguration.gracefulTerminationTimeout),
                activeQueryPromise,
              ]);
            }

            if (!isActive) {
              return;
            }

            await query('DISCARD ALL');

            // eslint-disable-next-line require-atomic-updates
            isActive = false;

            if (driverConfiguration.idleTimeout !== 'DISABLE_TIMEOUT') {
              clearIdleTimeout();

              idleTimeout = setTimeout(() => {
                void client.destroy();

                idleTimeout = null;
              }, driverConfiguration.idleTimeout).unref();
            }

            clientEventEmitter.emit('release');
          },
          removeListener: (event, listener) => {
            return clientEventEmitter.removeListener(event, listener);
          },
          stream: (sql, values) => {
            if (isDestroyed) {
              throw new Error('Client is destroyed.');
            }

            if (!isActive) {
              throw new Error('Client is not active.');
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
