// @flow

import type {
  TypeParserType,
} from '../../types';

const timestampParser = (value: string | null) => {
  return value === null ? value : Date.parse(value);
};

export const createTimestampTypeParser = (): TypeParserType => {
  return {
    name: 'timestamp',
    parse: timestampParser,
  };
};
