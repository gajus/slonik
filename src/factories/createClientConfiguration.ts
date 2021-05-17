import {
  InvalidConfigurationError,
} from '../errors';
import {
  createTypeParserPreset,
} from './createTypeParserPreset';
import type {
  ClientConfigurationInputType,
  ClientConfigurationType,
  TypeParserType,
} from '../types';

export const createClientConfiguration = (clientUserConfigurationInput?: ClientConfigurationInputType): ClientConfigurationType => {
  const typeParsers: readonly TypeParserType[] = [];

  const configuration = {
    captureStackTrace: true,
    connectionRetryLimit: 3,
    connectionTimeout: 5000,
    idleInTransactionSessionTimeout: 60000,
    idleTimeout: 5000,

    interceptors: [],

    maximumPoolSize: 10,

    preferNativeBindings: true,
    statementTimeout: 60000,
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
