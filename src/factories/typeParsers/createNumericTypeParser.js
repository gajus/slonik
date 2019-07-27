// @flow

import type {
  TypeParserType,
} from '../../types';

const numericParser = (value) => {
  return parseFloat(value);
};

export default (): TypeParserType => {
  return {
    name: 'numeric',
    parse: numericParser,
  };
};
