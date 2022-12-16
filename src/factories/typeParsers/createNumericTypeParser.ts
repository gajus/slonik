import {
  type TypeParser,
} from '../../types';

const numericParser = (value: string) => {
  return Number.parseFloat(value);
};

export const createNumericTypeParser = (): TypeParser => {
  return {
    name: 'numeric',
    parse: numericParser,
  };
};
