import {
  type ConnectionContext,
} from '../../src/types';

export const createConnectionContext = (): ConnectionContext => {
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
