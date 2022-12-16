import {
  type TypeParser,
} from '../../types';

const timestampParser = (value: string | null) => {
  return value === null ? value : Date.parse(value);
};

export const createTimestampWithTimeZoneTypeParser = (): TypeParser => {
  return {
    name: 'timestamptz',
    parse: timestampParser,
  };
};
