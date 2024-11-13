import { type DriverTypeParser } from '@slonik/driver';
import {
  toSeconds as durationToSeconds,
  parse as parseIsoDuration,
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
