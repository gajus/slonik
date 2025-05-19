import { Logger as log } from '../Logger.js';
import type { ClientConfiguration } from '../types.js';

type PoolConfiguration = {
  idleTimeout: number;
  maximumPoolSize: number;
  minimumPoolSize: number;
};

export const createPoolConfiguration = (
  clientConfiguration: ClientConfiguration,
): PoolConfiguration => {
  const poolConfiguration = {
    idleTimeout: 10_000,
    maximumPoolSize: 10,
    minimumPoolSize: 0,
  };

  if (clientConfiguration.idleTimeout !== 'DISABLE_TIMEOUT') {
    if (clientConfiguration.idleTimeout === 0) {
      log.warn(
        'idleTimeout=0 sets timeout to 0 milliseconds; use idleTimeout=DISABLE_TIMEOUT to disable timeout',
      );

      poolConfiguration.idleTimeout = 1;
    } else {
      poolConfiguration.idleTimeout = clientConfiguration.idleTimeout;
    }
  }

  if (clientConfiguration.maximumPoolSize) {
    poolConfiguration.maximumPoolSize = clientConfiguration.maximumPoolSize;
  }

  if (clientConfiguration.minimumPoolSize) {
    poolConfiguration.minimumPoolSize = clientConfiguration.minimumPoolSize;
  }

  return poolConfiguration;
};
