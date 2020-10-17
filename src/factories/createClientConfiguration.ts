// @flow

import {
  InvalidConfigurationError,
} from '../errors';
import type {
  ClientConfigurationInputType,
  ClientConfigurationType,
  TypeParserType,
} from '../types';
import createTypeParserPreset from './createTypeParserPreset';

export default (clientUserConfigurationInput?: ClientConfigurationInputType): ClientConfigurationType => {
  const typeParsers: readonly TypeParserType[] = [];

  const configuration = {
    captureStackTrace: true,
    connectionRetryLimit: 3,
    connectionTimeout: 5000,
    idleInTransactionSessionTimeout: 60000,
    idleTimeout: 5000,

    // @ts-ignore
    interceptors: [],

    maximumPoolSize: 10,

    preferNativeBindings: true,
    statementTimeout: 60000,
    transactionRetryLimit: 5,
    typeParsers,

    // @ts-ignore
    ...clientUserConfigurationInput,
  };

  if (configuration.maximumPoolSize < 1) {
    throw new InvalidConfigurationError('maximumPoolSize must be equal to or greater than 1.');
  }

  if (!configuration.typeParsers || configuration.typeParsers === typeParsers) {
    // @ts-ignore
    configuration.typeParsers = createTypeParserPreset();
  }

  return configuration;
};
