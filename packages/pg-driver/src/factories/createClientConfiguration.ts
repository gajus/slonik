import { type DriverConfiguration, parseDsn } from '@slonik/internals';
import { type ClientConfig as NativePostgresClientConfiguration } from 'pg';

export const createClientConfiguration = (
  clientConfiguration: DriverConfiguration,
): NativePostgresClientConfiguration => {
  const connectionOptions = parseDsn(clientConfiguration.connectionUri);

  const poolConfiguration: NativePostgresClientConfiguration = {
    application_name: connectionOptions.applicationName,
    database: connectionOptions.databaseName,
    host: connectionOptions.host,
    options: connectionOptions.options,
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
      poolConfiguration.connectionTimeoutMillis = 1;
    } else {
      poolConfiguration.connectionTimeoutMillis =
        clientConfiguration.connectionTimeout;
    }
  }

  if (clientConfiguration.statementTimeout !== 'DISABLE_TIMEOUT') {
    if (clientConfiguration.statementTimeout === 0) {
      // eslint-disable-next-line canonical/id-match
      poolConfiguration.statement_timeout = 1;
    } else {
      // eslint-disable-next-line canonical/id-match
      poolConfiguration.statement_timeout =
        clientConfiguration.statementTimeout;
    }
  }

  if (
    clientConfiguration.idleInTransactionSessionTimeout !== 'DISABLE_TIMEOUT'
  ) {
    if (clientConfiguration.idleInTransactionSessionTimeout === 0) {
      // eslint-disable-next-line canonical/id-match
      poolConfiguration.idle_in_transaction_session_timeout = 1;
    } else {
      // eslint-disable-next-line canonical/id-match
      poolConfiguration.idle_in_transaction_session_timeout =
        clientConfiguration.idleInTransactionSessionTimeout;
    }
  }

  return poolConfiguration;
};
