import { type ConnectionOptions } from '../types';
import { stringify } from 'node:querystring';

type NamedParameters = {
  application_name?: string;
  options?: string;
  sslmode?: string;
};

export const stringifyDsn = (connectionOptions: ConnectionOptions): string => {
  const {
    applicationName,
    databaseName,
    host,
    options,
    password,
    port,
    sslMode,
    username,
  } = connectionOptions;

  const tokens = ['postgresql://'];

  if (username) {
    tokens.push(encodeURIComponent(username));

    if (password) {
      tokens.push(':', encodeURIComponent(password));
    }

    tokens.push('@');
  }

  tokens.push(host ?? '');

  if (port) {
    tokens.push(':', String(port));
  }

  if (databaseName) {
    tokens.push('/', encodeURIComponent(databaseName));
  }

  const namedParameters: NamedParameters = {};

  if (applicationName) {
    // eslint-disable-next-line canonical/id-match
    namedParameters.application_name = applicationName;
  }

  if (options) {
    namedParameters.options = options;
  }

  if (sslMode) {
    namedParameters.sslmode = sslMode;
  }

  if (Object.keys(namedParameters).length > 0) {
    tokens.push('?', stringify(namedParameters as {}));
  }

  return tokens.join('');
};
