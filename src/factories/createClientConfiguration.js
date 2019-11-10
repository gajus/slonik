// @flow

import type {
  ClientConfigurationInputType,
  ClientConfigurationType,
  TypeParserType,
} from '../types';
import createTypeParserPreset from './createTypeParserPreset';

export default (clientUserConfiguration?: ClientConfigurationInputType): ClientConfigurationType => {
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
    ...clientUserConfiguration,
  };

  if (!configuration.typeParsers || configuration.typeParsers === typeParsers) {
    // $FlowFixMe
    configuration.typeParsers = createTypeParserPreset();
  }

  return configuration;
};
