// @flow

import type {
  QueryContextType,
} from '../../src/types';

export const createQueryContext = (): QueryContextType => {
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
