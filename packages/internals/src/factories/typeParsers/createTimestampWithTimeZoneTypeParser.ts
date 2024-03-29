import { type TypeParser } from '../../types';

const timestampParser = (value: string | null) => {
  if (value === 'infinity') {
    return Number.POSITIVE_INFINITY;
  }

  if (value === '-infinity') {
    return Number.NEGATIVE_INFINITY;
  }

  return value === null ? value : Date.parse(value);
};

export const createTimestampWithTimeZoneTypeParser = (): TypeParser => {
  return {
    name: 'timestamptz',
    parse: timestampParser,
  };
};
