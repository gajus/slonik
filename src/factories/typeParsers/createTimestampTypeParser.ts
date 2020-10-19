// @flow

import type {
  TypeParserType,
} from '../../types';

const timestampParser = <T>(value: T) => {
  return value === null ? value : Date.parse(value);
};

export default (): TypeParserType => {
  return {
    name: 'timestamp',
    parse: timestampParser,
  };
};
