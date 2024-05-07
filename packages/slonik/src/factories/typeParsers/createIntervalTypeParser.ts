import { type DriverTypeParser } from '@slonik/driver';
import {
  parse as parseIsoDuration,
  toSeconds as durationToSeconds,
} from 'iso8601-duration';
import parseInterval from 'postgres-interval';

const intervalParser = (value: string) => {
  return value === null
    ? value
    : durationToSeconds(parseIsoDuration(parseInterval(value).toISOString()));
};

export const createIntervalTypeParser = (): DriverTypeParser => {
  return {
    name: 'interval',
    parse: intervalParser,
  };
};
