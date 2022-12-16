import {
  type TypeParser,
} from '../../types';

const bigintParser = (value: string) => {
  return BigInt(value);
};

export const createBigintTypeParser = (): TypeParser => {
  return {
    name: 'int8',
    parse: bigintParser,
  };
};
