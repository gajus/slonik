import type {
  TypeParserType,
} from '../../types';

const bigintParser = (value: string) => {
  return BigInt(value);
};

export const createBigintTypeParser = (): TypeParserType => {
  return {
    name: 'int8',
    parse: bigintParser,
  };
};
