// @flow

import type {
  TypeParserType,
} from '../../types';

const bigintParser = (value) => {
  return BigInt(value);
};

export default (): TypeParserType => {
  return {
    name: 'int8',
    parse: bigintParser,
  };
};
