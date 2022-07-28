import {
  type TypeParser,
} from '../../types';

const dateParser = (value: string) => {
  return value;
};

export const createDateTypeParser = (): TypeParser => {
  return {
    name: 'date',
    parse: dateParser,
  };
};
