import { type TypeParser } from '../../types';
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

export const createIntervalTypeParser = (): TypeParser => {
  return {
    name: 'interval',
    parse: intervalParser,
  };
};
