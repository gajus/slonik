// @flow

import type {
  TypeParserType
} from '../types';
import {
  createBigintTypeParser,
  createIntervalTypeParser,
  createTimestampTypeParser,
  createTimestampWithTimeZoneTypeParser
} from './typeParsers';

export default (): $ReadOnlyArray<TypeParserType> => {
  return [
    createBigintTypeParser(),
    createIntervalTypeParser(),
    createTimestampTypeParser(),
    createTimestampWithTimeZoneTypeParser()
  ];
};
