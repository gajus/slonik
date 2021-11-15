/* eslint-disable id-match */

import {
  stringify,
} from 'querystring';
import type {
  ConnectionOptions,
} from '../types';

export const stringifyDsn = (connectionOptions: ConnectionOptions): string => {
  const {
    applicationName,
    databaseName,
    host,
    password,
    port,
    sslMode,
    username,
  } = connectionOptions;

  const tokens = [
    'postgresql://',
  ];

  if (username) {
    tokens.push(
      username,
    );

    if (password) {
      tokens.push(
        ':',
        password,
      );
    }

    tokens.push('@');
  }

  tokens.push(host ?? '');

  if (port) {
    tokens.push(
      ':',
      String(port),
    );
  }

  if (databaseName) {
    tokens.push(
      '/',
      databaseName,
    );
  }

  const namedParameters: any = {};

  if (applicationName) {
    namedParameters.application_name = applicationName;
  }

  if (sslMode) {
    namedParameters.sslmode = sslMode;
  }

  if (Object.keys(namedParameters).length > 0) {
    tokens.push(
      '?',
      stringify(namedParameters as {}),
    );
  }

  return tokens.join('');
};
