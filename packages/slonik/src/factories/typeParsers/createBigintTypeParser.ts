import type { DriverTypeParser } from '@slonik/driver';

// eslint-disable-next-line unicorn/prefer-native-coercion-functions
const bigintParser = (value: string) => {
  return BigInt(value);
};

export const createBigintTypeParser = (): DriverTypeParser => {
  return {
    name: 'int8',
    parse: bigintParser,
  };
};
