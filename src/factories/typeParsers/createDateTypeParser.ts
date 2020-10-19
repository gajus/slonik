// @flow

import type {
  TypeParserType,
} from '../../types';

const dateParser = (value) => {
  return value;
};

export default (): TypeParserType => {
  return {
    name: 'date',
    parse: dateParser,
  };
};
