// @flow

import type {
  ConnectionContextType,
} from '../../src/types';

export default (): ConnectionContextType => {
  // $FlowFixMe
  return {
    connectionId: '1',

    // $FlowFixMe
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
