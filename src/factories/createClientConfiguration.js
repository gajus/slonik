// @flow

import type {
  ClientConfigurationType,
  ClientUserConfigurationType,
  TypeParserType
} from '../types';
import Logger from '../Logger';
import createTypeParserPreset from './createTypeParserPreset';

const log = Logger.child({
  namespace: 'createClientConfiguration'
});

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

  if (configuration.connectionTimeout === 'DISABLE_TIMEOUT') {
    configuration.connectionTimeout = 0;
  } else if (configuration.connectionTimeout === 0) {
    log.warn('connectionTimeout=0 sets timeout to 0 milliseconds; use connectionTimeout=DISABLE_TIMEOUT to disable timeout');

    configuration.connectionTimeout = 1;
  }

  if (configuration.idleTimeout === 'DISABLE_TIMEOUT') {
    configuration.idleTimeout = 0;
  } else if (configuration.idleTimeout === 0) {
    log.warn('idleTimeout=0 sets timeout to 0 milliseconds; use idleTimeout=DISABLE_TIMEOUT to disable timeout');

    configuration.idleTimeout = 1;
  }

  return configuration;
};
