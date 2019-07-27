// @flow

import type {
  TypeParserType,
} from '../types';
import {
  createBigintTypeParser,
  createDateTypeParser,
  createIntervalTypeParser,
  createNumericTypeParser,
  createTimestampTypeParser,
  createTimestampWithTimeZoneTypeParser,
} from './typeParsers';

export default (): $ReadOnlyArray<TypeParserType> => {
  return [
    createBigintTypeParser(),
    createDateTypeParser(),
    createIntervalTypeParser(),
    createNumericTypeParser(),
    createTimestampTypeParser(),
    createTimestampWithTimeZoneTypeParser(),
  ];
};
