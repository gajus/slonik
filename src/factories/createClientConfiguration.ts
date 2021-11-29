import {
  InvalidConfigurationError,
} from '../errors';
import type {
  ClientConfigurationInputType,
  ClientConfigurationType,
  TypeParserType,
} from '../types';
import {
  createTypeParserPreset,
} from './createTypeParserPreset';

export const createClientConfiguration = (clientUserConfigurationInput?: ClientConfigurationInputType): ClientConfigurationType => {
  const typeParsers: readonly TypeParserType[] = [];

  const configuration = {
    captureStackTrace: true,
    connectionRetryLimit: 3,
    connectionTimeout: 5_000,
    idleInTransactionSessionTimeout: 60_000,
    idleTimeout: 5_000,
    interceptors: [],
    maximumPoolSize: 10,
    queryRetryLimit: 5,
    statementTimeout: 60_000,
    transactionRetryLimit: 5,
    typeParsers,

    ...clientUserConfigurationInput,
  };

  if (configuration.maximumPoolSize < 1) {
    throw new InvalidConfigurationError('maximumPoolSize must be equal to or greater than 1.');
  }

  if (!configuration.typeParsers || configuration.typeParsers === typeParsers) {
    configuration.typeParsers = createTypeParserPreset();
  }

  return configuration;
};
