// @flow

import type {
  TypeParserType,
} from '../../types';

const numericParser = <T>(value: T) => {
  return Number.parseFloat(value);
};

export default (): TypeParserType => {
  return {
    name: 'numeric',
    parse: numericParser,
  };
};
