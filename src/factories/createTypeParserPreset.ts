import {
  createBigintTypeParser,
  createDateTypeParser,
  createIntervalTypeParser,
  createNumericTypeParser,
  createTimestampTypeParser,
  createTimestampWithTimeZoneTypeParser,
} from './typeParsers';
import type {
  TypeParserType,
} from '../types';

export const createTypeParserPreset = (): readonly TypeParserType[] => {
  return [
    createBigintTypeParser(),
    createDateTypeParser(),
    createIntervalTypeParser(),
    createNumericTypeParser(),
    createTimestampTypeParser(),
    createTimestampWithTimeZoneTypeParser(),
  ];
};
