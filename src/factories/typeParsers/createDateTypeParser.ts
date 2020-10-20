// @flow

import type {
  TypeParserType,
} from '../../types';

const dateParser = (value: string) => {
  return value;
};

export default (): TypeParserType => {
  return {
    name: 'date',
    parse: dateParser,
  };
};
