// @flow

import type {
  TypeParserType
} from '../../types';

export default (): TypeParserType => {
  return {
    name: 'int8',
    parse: (value) => {
      // @todo Use bigint when value is greater than Number.MAX_SAFE_INTEGER.
      return parseInt(value, 10);
    }
  };
};
