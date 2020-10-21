import type {
  TypeParserType,
} from '../../types';

const dateParser = (value: string) => {
  return value;
};

export const createDateTypeParser = (): TypeParserType => {
  return {
    name: 'date',
    parse: dateParser,
  };
};
