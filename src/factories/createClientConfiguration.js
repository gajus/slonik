// @flow

import type {
  ClientConfigurationInputType,
  ClientConfigurationType,
  TypeParserType,
} from '../types';
import {
  InvalidConfigurationError,
} from '../errors';
import createTypeParserPreset from './createTypeParserPreset';

export default (clientUserConfigurationInput?: ClientConfigurationInputType): ClientConfigurationType => {
  const typeParsers: $ReadOnlyArray<TypeParserType> = [];

  const configuration = {
    captureStackTrace: true,
    connectionRetryLimit: 3,
    connectionTimeout: 5000,
    idleTimeout: 5000,

    // $FlowFixMe
    interceptors: [],

    maximumPoolSize: 10,
    minimumPoolSize: 0,

    preferNativeBindings: true,

    typeParsers,

    // $FlowFixMe
    ...clientUserConfigurationInput,
  };

  if (configuration.minimumPoolSize < 0) {
    throw new InvalidConfigurationError('minimumPoolSize must be equal to or greater than 0.');
  }

  if (configuration.maximumPoolSize < 1) {
    throw new InvalidConfigurationError('maximumPoolSize must be equal to or greater than 1.');
  }

  if (configuration.minimumPoolSize > configuration.maximumPoolSize) {
    throw new InvalidConfigurationError('maximumPoolSize must be equal to or greater than minimumPoolSize.');
  }

  if (!configuration.typeParsers || configuration.typeParsers === typeParsers) {
    // $FlowFixMe
    configuration.typeParsers = createTypeParserPreset();
  }

  return configuration;
};
