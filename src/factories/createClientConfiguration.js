// @flow

import type {
  ClientConfigurationType,
  ClientUserConfigurationType,
  TypeParserType
} from '../types';
import createTypeParserPreset from './createTypeParserPreset';

export default (clientUserConfiguration?: ClientUserConfigurationType): ClientConfigurationType => {
  const typeParsers: $ReadOnlyArray<TypeParserType> = [];
  const configuration = {
    captureStackTrace: true,
    connectionTimeout: 5000,
    idleTimeout: 5000,

    // $FlowFixMe
    interceptors: [],

    maximumPoolSize: 10,
    minimumPoolSize: 0,

    typeParsers,
    ...clientUserConfiguration
  };

  if (!configuration.typeParsers || configuration.typeParsers === typeParsers) {
    // $FlowFixMe
    configuration.typeParsers = createTypeParserPreset();
  }

  return configuration;
};
