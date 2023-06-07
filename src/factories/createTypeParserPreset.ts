import { type TypeParser } from '../types';
import { createBigintTypeParser } from './typeParsers/createBigintTypeParser';
import { createDateTypeParser } from './typeParsers/createDateTypeParser';
import { createIntervalTypeParser } from './typeParsers/createIntervalTypeParser';
import { createNumericTypeParser } from './typeParsers/createNumericTypeParser';
import { createTimestampTypeParser } from './typeParsers/createTimestampTypeParser';
import { createTimestampWithTimeZoneTypeParser } from './typeParsers/createTimestampWithTimeZoneTypeParser';

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
