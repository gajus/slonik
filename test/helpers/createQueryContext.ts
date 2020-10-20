// @flow

import type {
  QueryContextType,
} from '../../src/types';

export const createQueryContext = (): QueryContextType => {
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
