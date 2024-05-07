import { type QueryContext } from 'slonik';

export default () => {
  return {
    connectionId: '1',
    log: {
      getContext: () => {
        return {
          connectionId: '1',
          poolId: '1',
        };
      },
    },
    poolId: '1',
  } as unknown as QueryContext;
};
