// @flow

import type {
  ClientConfigurationType,
} from '../../src/types';

export default (): ClientConfigurationType => {
  return {
    captureStackTrace: true,
    connectionRetryLimit: 3,
    connectionTimeout: 5000,
    idleTimeout: 5000,
    interceptors: [],
    maximumPoolSize: 10,
    minimumPoolSize: 0,
    preferNativeBindings: true,
    typeParsers: [],
  };
};
