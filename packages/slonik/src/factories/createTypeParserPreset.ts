import { createBigintTypeParser } from './typeParsers/createBigintTypeParser.js';
import { createDateTypeParser } from './typeParsers/createDateTypeParser.js';
import { createIntervalTypeParser } from './typeParsers/createIntervalTypeParser.js';
import { createNumericTypeParser } from './typeParsers/createNumericTypeParser.js';
import { createTimestampTypeParser } from './typeParsers/createTimestampTypeParser.js';
import { createTimestampWithTimeZoneTypeParser } from './typeParsers/createTimestampWithTimeZoneTypeParser.js';
import type { DriverTypeParser } from '@slonik/driver';

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
