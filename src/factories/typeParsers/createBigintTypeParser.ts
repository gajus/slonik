import { type TypeParser } from '../../types';

// eslint-disable-next-line unicorn/prefer-native-coercion-functions
const bigintParser = (value: string) => {
  return BigInt(value);
};

export const createBigintTypeParser = (): TypeParser => {
  return {
    name: 'int8',
    parse: bigintParser,
  };
};
