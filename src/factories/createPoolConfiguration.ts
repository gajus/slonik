/* eslint-disable canonical/id-match */

import {
  type PoolConfig,
} from 'pg';
import {
  Logger as log,
} from '../Logger';
import {
  type ClientConfiguration,
} from '../types';
import {
  parseDsn,
} from '../utilities';

export const createPoolConfiguration = (dsn: string, clientConfiguration: ClientConfiguration): PoolConfig => {
  const connectionOptions = parseDsn(dsn);

  const poolConfiguration: PoolConfig = {
    application_name: connectionOptions.applicationName,
    database: connectionOptions.databaseName,
    host: connectionOptions.host,
    password: connectionOptions.password,
    port: connectionOptions.port,
    ssl: false,
    user: connectionOptions.username,
  };

  if (clientConfiguration.ssl) {
    poolConfiguration.ssl = clientConfiguration.ssl;
  } else if (connectionOptions.sslMode === 'disable') {
    poolConfiguration.ssl = false;
  } else if (connectionOptions.sslMode === 'require') {
    poolConfiguration.ssl = true;
  } else if (connectionOptions.sslMode === 'no-verify') {
    poolConfiguration.ssl = {
      rejectUnauthorized: false,
    };
  }

  if (clientConfiguration.connectionTimeout !== 'DISABLE_TIMEOUT') {
    if (clientConfiguration.connectionTimeout === 0) {
      log.warn('connectionTimeout=0 sets timeout to 0 milliseconds; use connectionTimeout=DISABLE_TIMEOUT to disable timeout');

      poolConfiguration.connectionTimeoutMillis = 1;
    } else {
      poolConfiguration.connectionTimeoutMillis = clientConfiguration.connectionTimeout;
    }
  }

  if (clientConfiguration.statementTimeout !== 'DISABLE_TIMEOUT') {
    if (clientConfiguration.statementTimeout === 0) {
      log.warn('statementTimeout=0 sets timeout to 0 milliseconds; use statementTimeout=DISABLE_TIMEOUT to disable timeout');

      poolConfiguration.statement_timeout = 1;
    } else {
      poolConfiguration.statement_timeout = clientConfiguration.statementTimeout;
    }
  }

  if (clientConfiguration.idleTimeout !== 'DISABLE_TIMEOUT') {
    if (clientConfiguration.idleTimeout === 0) {
      log.warn('idleTimeout=0 sets timeout to 0 milliseconds; use idleTimeout=DISABLE_TIMEOUT to disable timeout');

      poolConfiguration.idleTimeoutMillis = 1;
    } else {
      poolConfiguration.idleTimeoutMillis = clientConfiguration.idleTimeout;
    }
  }

  if (clientConfiguration.idleInTransactionSessionTimeout !== 'DISABLE_TIMEOUT') {
    if (clientConfiguration.idleInTransactionSessionTimeout === 0) {
      log.warn('idleInTransactionSessionTimeout=0 sets timeout to 0 milliseconds; use idleInTransactionSessionTimeout=DISABLE_TIMEOUT to disable timeout');

      poolConfiguration.idle_in_transaction_session_timeout = 1;
    } else {
      poolConfiguration.idle_in_transaction_session_timeout = clientConfiguration.idleInTransactionSessionTimeout;
    }
  }

  if (clientConfiguration.maximumPoolSize) {
    poolConfiguration.max = clientConfiguration.maximumPoolSize;
  }

  return poolConfiguration;
};
