import {
  type TypeParser,
} from '../types';
import {
  createBigintTypeParser,
  createDateTypeParser,
  createIntervalTypeParser,
  createNumericTypeParser,
  createTimestampTypeParser,
  createTimestampWithTimeZoneTypeParser,
} from './typeParsers';

export const createTypeParserPreset = (): readonly TypeParser[] => {
  return [
    createBigintTypeParser(),
    createDateTypeParser(),
    createIntervalTypeParser(),
    createNumericTypeParser(),
    createTimestampTypeParser(),
    createTimestampWithTimeZoneTypeParser(),
  ];
};
