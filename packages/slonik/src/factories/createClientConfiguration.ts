import {
  type ClientConfiguration,
  type ClientConfigurationInput,
} from '../types';
import { createTypeParserPreset } from './createTypeParserPreset';
import { type DriverTypeParser } from '@slonik/driver';
import { InvalidConfigurationError } from '@slonik/errors';

export const createClientConfiguration = (
  connectionUri: string,
  clientUserConfigurationInput?: ClientConfigurationInput,
): ClientConfiguration => {
  const typeParsers: readonly DriverTypeParser[] = [];

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
    minimumPoolSize: 0,
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

  if (configuration.minimumPoolSize < 0) {
    throw new InvalidConfigurationError(
      'minimumPoolSize must be equal to or greater than 0.',
    );
  }

  if (configuration.maximumPoolSize < configuration.minimumPoolSize) {
    throw new InvalidConfigurationError(
      'maximumPoolSize must be equal to or greater than minimumPoolSize.',
    );
  }

  if (!configuration.typeParsers || configuration.typeParsers === typeParsers) {
    configuration.typeParsers = createTypeParserPreset();
  }

  return configuration;
};
