// @flow

import type {
  TypeParserType,
} from '../../types';

const numericParser = (value: string) => {
  return Number.parseFloat(value);
};

export default (): TypeParserType => {
  return {
    name: 'numeric',
    parse: numericParser,
  };
};
