// @flow

import type {
  TypeParserType,
} from '../../types';

const numericParser = (value) => {
  return Number.parseFloat(value);
};

export default (): TypeParserType => {
  return {
    name: 'numeric',
    parse: numericParser,
  };
};
