import {
  type TypeParser,
} from '../../types';

const bigintParser = (value: string) => {
  // @todo Use bigint when value is greater than Number.MAX_SAFE_INTEGER.
  return Number.parseInt(value, 10);
};

export const createBigintTypeParser = (): TypeParser => {
  return {
    name: 'int8',
    parse: bigintParser,
  };
};
