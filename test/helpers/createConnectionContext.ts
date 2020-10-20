// @flow

import type {
  ConnectionContextType,
} from '../../src/types';

export const createConnectionContext = (): ConnectionContextType => {
  return {
    connectionId: '1',

    // @ts-expect-error
    log: {
      getContext: () => {
        return {
          connectionId: '1',
          poolId: '1',
        };
      },
    },
    poolId: '1',
  };
};
