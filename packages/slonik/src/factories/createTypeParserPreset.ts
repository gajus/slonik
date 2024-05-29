import { createBigintTypeParser } from './typeParsers/createBigintTypeParser';
import { createDateTypeParser } from './typeParsers/createDateTypeParser';
import { createIntervalTypeParser } from './typeParsers/createIntervalTypeParser';
import { createNumericTypeParser } from './typeParsers/createNumericTypeParser';
import { createTimestampTypeParser } from './typeParsers/createTimestampTypeParser';
import { createTimestampWithTimeZoneTypeParser } from './typeParsers/createTimestampWithTimeZoneTypeParser';
import { type DriverTypeParser } from '@slonik/driver';

export const createTypeParserPreset = (): readonly DriverTypeParser[] => {
  return [
    createBigintTypeParser(),
    createDateTypeParser(),
    createIntervalTypeParser(),
    createNumericTypeParser(),
    createTimestampTypeParser(),
    createTimestampWithTimeZoneTypeParser(),
  ];
};
