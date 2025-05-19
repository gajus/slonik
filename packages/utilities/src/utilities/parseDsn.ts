// cspell:ignore sslrootcert, sslcert

import { UnexpectedStateError } from '@slonik/errors';
import type { ConnectionOptions } from '@slonik/types';
import { readFileSync } from 'node:fs';
import { z } from 'zod';

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

  const searchParameters = z
    .object({
      application_name: z.string().optional(),
      options: z.string().optional(),
      sslcert: z
        .string()
        .optional()
        .describe('Specifies the file name of the client SSL certificate.'),
      sslkey: z
        .string()
        .optional()
        .describe(
          'Specifies the location for the secret key used for the client certificate.',
        ),
      sslmode: z.enum(['disable', 'no-verify', 'require']).optional(),
      sslrootcert: z
        .string()
        .optional()
        .describe(
          'Specifies the name of a file containing SSL certificate authority (CA) certificate(s).',
        ),
    })
    .parse(Object.fromEntries(url.searchParams));

  if (searchParameters.application_name) {
    connectionOptions.applicationName = searchParameters.application_name;
  }

  if (searchParameters.options) {
    connectionOptions.options = searchParameters.options;
  }

  if (searchParameters.sslmode) {
    connectionOptions.sslMode = searchParameters.sslmode;
  }

  let sslCert: string | undefined;
  let sslKey: string | undefined;
  let sslRootCert: string | undefined;

  if (searchParameters.sslcert) {
    try {
      sslCert = readFileSync(searchParameters.sslcert, 'utf8');
    } catch {
      throw new UnexpectedStateError('Failed to read SSL certificate file.');
    }
  }

  if (searchParameters.sslkey) {
    try {
      sslKey = readFileSync(searchParameters.sslkey, 'utf8');
    } catch {
      throw new UnexpectedStateError('Failed to read SSL key file.');
    }
  }

  if (searchParameters.sslrootcert) {
    try {
      sslRootCert = readFileSync(searchParameters.sslrootcert, 'utf8');
    } catch {
      throw new UnexpectedStateError(
        'Failed to read SSL root certificate file.',
      );
    }
  }

  if (sslCert || sslKey || sslRootCert) {
    if ((sslCert && !sslKey) || (!sslCert && sslKey)) {
      throw new UnexpectedStateError(
        'Both sslcert and sslkey must be provided together.',
      );
    }

    connectionOptions.ssl = {
      ca: sslRootCert,
      cert: sslCert,
      key: sslKey,
      rejectUnauthorized: searchParameters.sslmode !== 'no-verify',
    };
  }

  return connectionOptions;
};
