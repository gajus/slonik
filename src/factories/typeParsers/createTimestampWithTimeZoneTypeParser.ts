import type {
  TypeParserType,
} from '../../types';

const timestampParser = (value: string | null) => {
  return value === null ? value : Date.parse(value + ' UTC');
};

export const createTimestampWithTimeZoneTypeParser = (): TypeParserType => {
  return {
    name: 'timestamptz',
    parse: timestampParser,
  };
};
