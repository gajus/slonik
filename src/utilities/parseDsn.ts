import { Logger } from '../Logger';
import { type ConnectionOptions } from '../types';

const log = Logger.child({
  namespace: 'parseDsn',
});

export const parseDsn = (dsn: string): ConnectionOptions => {
  if (dsn.trim() === '') {
    return {};
  }

  const url = new URL(dsn);

  const connectionOptions: ConnectionOptions = {};

  if (url.host) {
    connectionOptions.host = decodeURIComponent(url.hostname);
  } else if (url.searchParams.has('host')) {
    const host = url.searchParams.get('host');

    if (typeof host === 'string' && host) {
      connectionOptions.host = host;
    }
  }

  if (url.port) {
    connectionOptions.port = Number(url.port);
  }

  if (url.pathname && url.pathname !== '/') {
    connectionOptions.databaseName = decodeURIComponent(
      url.pathname.split('/')[1],
    );
  }

  if (url.username) {
    connectionOptions.username = decodeURIComponent(url.username);
  }

  if (url.password) {
    connectionOptions.password = decodeURIComponent(url.password);
  }

  const {
    application_name: applicationName,
    options,
    sslmode: sslMode,
    ...unsupportedOptions
  } = Object.fromEntries(url.searchParams);

  if (Object.keys(unsupportedOptions).length > 0) {
    log.warn(
      {
        unsupportedOptions,
      },
      'unsupported DSN parameters',
    );
  }

  if (applicationName) {
    connectionOptions.applicationName = applicationName;
  }

  if (options) {
    connectionOptions.options = options;
  }

  if (sslMode) {
    connectionOptions.sslMode = sslMode as ConnectionOptions['sslMode'];
  }

  return connectionOptions;
};
