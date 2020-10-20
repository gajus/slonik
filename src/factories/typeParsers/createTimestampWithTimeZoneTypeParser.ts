// @flow

import type {
  TypeParserType,
} from '../../types';

const timestampParser = (value: string | null) => {
  return value === null ? value : Date.parse(value);
};

export default (): TypeParserType => {
  return {
    name: 'timestamptz',
    parse: timestampParser,
  };
};
