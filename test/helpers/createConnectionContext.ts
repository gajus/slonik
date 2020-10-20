// @flow

import type {
  ConnectionContextType,
} from '../../src/types';

export const createConnectionContext = (): ConnectionContextType => {
  // @ts-ignore
  return {
    connectionId: '1',

    // @ts-ignore
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
