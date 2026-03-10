import { Logger as log } from '../Logger.js';
import type { ClientConfiguration } from '../types.js';

type PoolConfiguration = {
  idleTimeout: number;
  /**
   * The maximum age of a connection allowed in the pool.
   * After this age, the connection will be destroyed.
   * @default 30 minutes
   */
  maximumConnectionAge: number;
  maximumPoolSize: number;
  minimumPoolSize: number;
};

/**
 * Resolves a timeout field that accepts either a millisecond value or
 * 'DISABLE_TIMEOUT'. Passing 0 is treated as a misconfiguration: a warning
 * is emitted and the value is clamped to 1ms so the timeout still fires.
 * 'DISABLE_TIMEOUT' maps to Number.POSITIVE_INFINITY so internal pool logic
 * can use plain numeric comparisons without handling the sentinel string.
 */
const resolveTimeout = <T extends 'DISABLE_TIMEOUT' | number | undefined>(
  field: string,
  value: T,
): T extends undefined ? number | undefined : number => {
  if (value === 'DISABLE_TIMEOUT') {
    return Number.POSITIVE_INFINITY;
  }

  if (value === 0) {
    log.warn(
      `${field}=0 sets timeout to 0 milliseconds; use ${field}=DISABLE_TIMEOUT to disable`,
    );

    return 1;
  }

  return value as never;
};

export const createPoolConfiguration = (
  clientConfiguration: ClientConfiguration,
): PoolConfiguration => {
  const poolConfiguration: PoolConfiguration = {
    idleTimeout: 10_000,
    maximumConnectionAge: 30 * 60 * 1_000,
    maximumPoolSize: 10,
    minimumPoolSize: 0,
  };

  poolConfiguration.idleTimeout = resolveTimeout(
    'idleTimeout',
    clientConfiguration.idleTimeout,
  );

  const resolvedMaxAge = resolveTimeout(
    'maximumConnectionAge',
    clientConfiguration.maximumConnectionAge,
  );

  if (resolvedMaxAge !== undefined) {
    poolConfiguration.maximumConnectionAge = resolvedMaxAge;
  }

  if (clientConfiguration.maximumPoolSize) {
    poolConfiguration.maximumPoolSize = clientConfiguration.maximumPoolSize;
  }

  if (clientConfiguration.minimumPoolSize) {
    poolConfiguration.minimumPoolSize = clientConfiguration.minimumPoolSize;
  }

  return poolConfiguration;
};
