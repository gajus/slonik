// @flow

import type {
  ClientConfigurationType,
  ClientUserConfigurationType
} from '../types';
import createTypeParserPreset from './createTypeParserPreset';

export default (clientUserConfiguration?: ClientUserConfigurationType): ClientConfigurationType => {
  const configuration = {
    captureStackTrace: true,
    connectionTimeout: 5000,
    idleTimeout: 5000,

    // $FlowFixMe
    interceptors: [],

    maximumPoolSize: 10,
    minimumPoolSize: 0,

    // $FlowFixMe
    typeParsers: [],
    ...clientUserConfiguration
  };

  if (!configuration.typeParsers || !configuration.typeParsers.length) {
    configuration.typeParsers = createTypeParserPreset();
  }

  return configuration;
};
