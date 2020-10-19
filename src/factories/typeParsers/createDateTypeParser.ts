// @flow

import type {
  TypeParserType,
} from '../../types';

const dateParser = <T>(value: T) => {
  return value;
};

export default (): TypeParserType => {
  return {
    name: 'date',
    parse: dateParser,
  };
};
