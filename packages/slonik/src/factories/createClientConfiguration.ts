import {
  type ClientConfiguration,
  type ClientConfigurationInput,
  type TypeParser,
} from '../types';
import { createTypeParserPreset } from './createTypeParserPreset';
import { InvalidConfigurationError } from '@slonik/errors';

export const createClientConfiguration = (
  connectionUri: string,
  clientUserConfigurationInput?: ClientConfigurationInput,
): ClientConfiguration => {
  const typeParsers: readonly TypeParser[] = [];

  const configuration = {
    captureStackTrace: false,
    connectionRetryLimit: 3,
    connectionTimeout: 5_000,
    connectionUri,
    dangerouslyAllowForeignConnections: false,
    gracefulTerminationTimeout: 5_000,
    idleInTransactionSessionTimeout: 60_000,
    idleTimeout: 5_000,
    interceptors: [],
    maximumPoolSize: 10,
    queryRetryLimit: 5,
    resetConnection: ({ query }) => {
      return query(`DISCARD ALL`);
    },
    statementTimeout: 60_000,
    transactionRetryLimit: 5,
    typeParsers,
    ...clientUserConfigurationInput,
  };

  if (configuration.maximumPoolSize < 1) {
    throw new InvalidConfigurationError(
      'maximumPoolSize must be equal to or greater than 1.',
    );
  }

  if (!configuration.typeParsers || configuration.typeParsers === typeParsers) {
    configuration.typeParsers = createTypeParserPreset();
  }

  return configuration;
};
