// @flow

import type {
  ClientConfigurationType
} from '../../src/types';

export default (): ClientConfigurationType => {
  return {
    captureStackTrace: true,
    connectionTimeout: 5000,
    idleTimeout: 5000,
    interceptors: [],
    maximumPoolSize: 10,
    minimumPoolSize: 0,
    typeParsers: []
  };
};
