import type {
  ClientConfigurationType,
} from '../../src/types';

export const createClientConfiguration = (): ClientConfigurationType => {
  return {
    captureStackTrace: true,
    connectionRetryLimit: 3,
    connectionTimeout: 5_000,
    idleInTransactionSessionTimeout: 60_000,
    idleTimeout: 5_000,
    interceptors: [],
    maximumPoolSize: 10,
    queryRetryLimit: 5,
    statementTimeout: 60_000,
    transactionRetryLimit: 5,
    typeParsers: [],
  };
};
