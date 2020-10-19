// @flow

import type {
  ClientConfigurationType,
} from '../../src/types';

export default (): ClientConfigurationType => {
  return {
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
    typeParsers: [],
  };
};
