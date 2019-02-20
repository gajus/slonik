// @flow

import type {
  TypeParserType
} from '../types';
import {
  createBigintTypeParser,
  createTimestampTypeParser,
  createTimestampWithTimeZoneTypeParser
} from './typeParsers';

export default (): $ReadOnlyArray<TypeParserType> => {
  return [
    createBigintTypeParser(),
    createTimestampTypeParser(),
    createTimestampWithTimeZoneTypeParser()
  ];
};
