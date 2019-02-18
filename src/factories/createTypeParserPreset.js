// @flow

import type {
  TypeParserType
} from '../types';

export default (): $ReadOnlyArray<TypeParserType> => {
  return [
    {
      name: 'int8',
      parse: (value) => {
        return parseInt(value, 10);
      }
    },
    {
      name: 'timestamp',
      parse: (value) => {
        return value === null ? value : Date.parse(value);
      }
    },
    {
      name: 'timestamptz',
      parse: (value) => {
        return value === null ? value : Date.parse(value);
      }
    }
  ];
};
