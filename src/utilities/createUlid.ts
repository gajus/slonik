// @flow

import {
  factory as ulidFactory,
  detectPrng,
} from 'ulid';

const ulid = ulidFactory(detectPrng(true));

export const createUlid = (): string => {
  return ulid();
};
