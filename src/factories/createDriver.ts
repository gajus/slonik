import { type ClientConfiguration, type TypedReadable } from '../types';
import { createUid } from '../utilities/createUid';
import { type ConnectionPoolClient } from './createConnectionPool';
import EventEmitter from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { type StrictEventEmitter } from 'strict-event-emitter-types';

export type DriverNotice = {
  message: string;
};

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

export type DriverFactory = ({
  clientConfiguration,
}: {
  clientConfiguration: ClientConfiguration;
}) => Promise<ConnectionPoolClient>;

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

type InternalPoolClientFactorySetup = ({
  eventEmitter,
  clientConfiguration,
}: {
  clientConfiguration: ClientConfiguration;
  eventEmitter: ClientEventEmitter;
}) => Promise<InternalPoolClientFactory>;

type InternalPoolClientFactory = () => InternalPoolClient;

export const createDriver = (
  setup: InternalPoolClientFactorySetup,
): DriverFactory => {
  return async ({ clientConfiguration }) => {
    const eventEmitter = new EventEmitter();

    const createPoolClient = await setup({
      clientConfiguration,
      eventEmitter,
    });

    const { query, stream, connect, end } = createPoolClient();

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

        eventEmitter.emit('acquire');
      },
      destroy: async () => {
        if (activeQueryPromise) {
          await Promise.race([
            delay(clientConfiguration.gracefulTerminationTimeout),
            activeQueryPromise,
          ]);
        }

        if (isDestroyed) {
          return;
        }

        clearIdleTimeout();

        isDestroyed = true;

        eventEmitter.emit('destroy');

        await end();
      },
      id: () => id,
      isActive: () => isActive,
      isIdle: () => {
        return !isActive;
      },
      off: (event, listener) => {
        return eventEmitter.off(event, listener);
      },
      on: (event, listener) => {
        return eventEmitter.on(event, listener);
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

          return result;
        } catch (error) {
          eventEmitter.emit('error', error);

          throw error;
        } finally {
          // eslint-disable-next-line require-atomic-updates
          activeQueryPromise = null;
        }
      },
      release: async () => {
        if (activeQueryPromise) {
          await Promise.race([
            delay(clientConfiguration.gracefulTerminationTimeout),
            activeQueryPromise,
          ]);
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
  };
};
