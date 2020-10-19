// @flow

import {
  parse as parseIsoDuration,
  toSeconds as durationToSeconds,
} from 'iso8601-duration';
import parseInterval from 'postgres-interval';
import type {
  TypeParserType,
} from '../../types';

const intervalParser = (value) => {
  return value === null ? value : durationToSeconds(parseIsoDuration(parseInterval(value).toISOString()));
};

export default (): TypeParserType => {
  return {
    name: 'interval',
    parse: intervalParser,
  };
};
