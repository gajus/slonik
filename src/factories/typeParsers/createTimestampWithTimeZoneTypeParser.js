// @flow

import type {
  TypeParserType
} from '../../types';

export default (): TypeParserType => {
  return {
    name: 'timestamp',
    parse: (value) => {
      return value === null ? value : Date.parse(value);
    }
  };
};
