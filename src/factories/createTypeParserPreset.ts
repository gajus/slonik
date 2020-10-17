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

export default (): ReadonlyArray<TypeParserType> => {
  return [
    createBigintTypeParser(),
    createDateTypeParser(),
    createIntervalTypeParser(),
    createNumericTypeParser(),
    createTimestampTypeParser(),
    createTimestampWithTimeZoneTypeParser(),
  ];
};
