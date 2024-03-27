/* eslint-disable canonical/id-match */

import { type ClientConfiguration, type TypeParser } from '../types';
import { parseDsn } from '../utilities/parseDsn';
import { createPoolClientFactory } from './createConnectionPool';
// eslint-disable-next-line no-restricted-imports
import {
  Client,
  type ClientConfig as NativePostgresClientConfiguration,
} from 'pg';
import { getTypeParser as getNativeTypeParser } from 'pg-types';
import { parse as parseArray } from 'postgres-array';

type PostgresType = {
  oid: string;
  typarray: string;
  typname: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypeOverrides = (oid: number) => any;

const createTypeOverrides = async (
  connection: Client,
  typeParsers: readonly TypeParser[],
): Promise<TypeOverrides> => {
  const typeNames = typeParsers.map((typeParser) => {
    return typeParser.name;
  });

  const postgresTypes = (
    await connection.query(
      'SELECT oid, typarray, typname FROM pg_type WHERE typname = ANY($1::text[])',
      [typeNames],
    )
  ).rows as PostgresType[];

  const parsers = {};

  for (const typeParser of typeParsers) {
    const postgresType = postgresTypes.find((maybeTargetPostgresType) => {
      return maybeTargetPostgresType.typname === typeParser.name;
    });

    if (!postgresType) {
      throw new Error('Database type "' + typeParser.name + '" not found.');
    }

    parsers[postgresType.oid] = (value) => {
      return typeParser.parse(value);
    };

    if (postgresType.typarray) {
      parsers[postgresType.typarray] = (arrayValue) => {
        return parseArray(arrayValue).map((value) => {
          return typeParser.parse(value);
        });
      };
    }
  }

  return (oid: number) => {
    if (parsers[oid]) {
      return parsers[oid];
    }

    return getNativeTypeParser(oid);
  };
};

const createClientConfiguration = (
  clientConfiguration: ClientConfiguration,
): NativePostgresClientConfiguration => {
  const connectionOptions = parseDsn(clientConfiguration.connectionUri);

  const poolConfiguration: NativePostgresClientConfiguration = {
    application_name: connectionOptions.applicationName,
    database: connectionOptions.databaseName,
    host: connectionOptions.host,
    options: connectionOptions.options,
    password: connectionOptions.password,
    port: connectionOptions.port,
    ssl: false,
    user: connectionOptions.username,
  };

  if (clientConfiguration.ssl) {
    poolConfiguration.ssl = clientConfiguration.ssl;
  } else if (connectionOptions.sslMode === 'disable') {
    poolConfiguration.ssl = false;
  } else if (connectionOptions.sslMode === 'require') {
    poolConfiguration.ssl = true;
  } else if (connectionOptions.sslMode === 'no-verify') {
    poolConfiguration.ssl = {
      rejectUnauthorized: false,
    };
  }

  if (clientConfiguration.connectionTimeout !== 'DISABLE_TIMEOUT') {
    if (clientConfiguration.connectionTimeout === 0) {
      poolConfiguration.connectionTimeoutMillis = 1;
    } else {
      poolConfiguration.connectionTimeoutMillis =
        clientConfiguration.connectionTimeout;
    }
  }

  if (clientConfiguration.statementTimeout !== 'DISABLE_TIMEOUT') {
    if (clientConfiguration.statementTimeout === 0) {
      poolConfiguration.statement_timeout = 1;
    } else {
      poolConfiguration.statement_timeout =
        clientConfiguration.statementTimeout;
    }
  }

  if (
    clientConfiguration.idleInTransactionSessionTimeout !== 'DISABLE_TIMEOUT'
  ) {
    if (clientConfiguration.idleInTransactionSessionTimeout === 0) {
      poolConfiguration.idle_in_transaction_session_timeout = 1;
    } else {
      poolConfiguration.idle_in_transaction_session_timeout =
        clientConfiguration.idleInTransactionSessionTimeout;
    }
  }

  return poolConfiguration;
};

const queryTypeOverrides = async (
  pgClientConfiguration: NativePostgresClientConfiguration,
  clientConfiguration: ClientConfiguration,
): Promise<TypeOverrides> => {
  const client = new Client(pgClientConfiguration);

  await client.connect();

  const typeOverrides = await createTypeOverrides(
    client,
    clientConfiguration.typeParsers,
  );

  await client.end();

  return typeOverrides;
};

export const createPgPoolClientFactory = () => {
  let getTypeParserPromise: Promise<TypeOverrides> | null = null;

  return createPoolClientFactory(
    async ({ clientConfiguration, eventEmitter }) => {
      const pgClientConfiguration =
        createClientConfiguration(clientConfiguration);

      if (!getTypeParserPromise) {
        getTypeParserPromise = queryTypeOverrides(
          pgClientConfiguration,
          clientConfiguration,
        );
      }

      // eslint-disable-next-line require-atomic-updates
      pgClientConfiguration.types = {
        getTypeParser: await getTypeParserPromise,
      };

      return () => {
        const client = new Client(pgClientConfiguration);

        client.on('notice', (notice) => {
          if (notice.message) {
            eventEmitter.emit('notice', {
              message: notice.message,
            });
          }
        });

        return {
          connect: async () => {
            await client.connect();
          },
          end: async () => {
            await client.end();
          },
          query: async (sql, values) => {
            return await client.query(sql, values);
          },
        };
      };
    },
  );
};
