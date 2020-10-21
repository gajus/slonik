/* eslint-disable id-match */

import {
  ConnectionOptions,
  parse as parseConnectionString,
} from 'pg-connection-string';
import {
  Logger as log,
} from '../Logger';
import type {
  ClientConfigurationType,
} from '../types';

export const createPoolConfiguration = (connectionUri: string, clientConfiguration: ClientConfigurationType) => {
  // @todo: make this not any. A few properties which don't exist on the interface are being set below
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poolConfiguration: any = parseConnectionString(connectionUri);

  // @see https://node-postgres.com/api/pool
  poolConfiguration.connectionTimeoutMillis = clientConfiguration.connectionTimeout;
  poolConfiguration.idleTimeoutMillis = clientConfiguration.idleTimeout;
  poolConfiguration.max = clientConfiguration.maximumPoolSize;

  if (clientConfiguration.connectionTimeout === 'DISABLE_TIMEOUT') {
    poolConfiguration.connectionTimeoutMillis = undefined;
  } else if (clientConfiguration.connectionTimeout === 0) {
    log.warn('connectionTimeout=0 sets timeout to 0 milliseconds; use connectionTimeout=DISABLE_TIMEOUT to disable timeout');

    poolConfiguration.connectionTimeoutMillis = 1;
  }

  if (poolConfiguration.ssl) {
    poolConfiguration.ssl = {
      rejectUnauthorized: false,
      ...poolConfiguration.ssl,
    };
  }

  // Temporary disabled.
  // There appears to be a bug in node-postgres.
  // https://github.com/brianc/node-postgres/issues/2103

  // poolConfiguration.idle_in_transaction_session_timeout = clientConfiguration.idleInTransactionSessionTimeout;
  // poolConfiguration.statement_timeout = clientConfiguration.statementTimeout;

  // if (clientConfiguration.idleInTransactionSessionTimeout === 'DISABLE_TIMEOUT') {
  //   poolConfiguration.idle_in_transaction_session_timeout = undefined;
  // } else if (clientConfiguration.idleInTransactionSessionTimeout === 0) {
  //   log.warn('idleInTransactionSessionTimeout=0 sets timeout to 0 milliseconds; use idleInTransactionSessionTimeout=DISABLE_TIMEOUT to disable timeout');

  //   poolConfiguration.idle_in_transaction_session_timeout = 1;
  // }

  // if (clientConfiguration.statementTimeout === 'DISABLE_TIMEOUT') {
  //   poolConfiguration.statement_timeout = undefined;
  // } else if (clientConfiguration.statementTimeout === 0) {
  //   log.warn('statementTimeout=0 sets timeout to 0 milliseconds; use statementTimeout=DISABLE_TIMEOUT to disable timeout');

  //   poolConfiguration.statement_timeout = 1;
  // }

  return poolConfiguration as ConnectionOptions;
};
