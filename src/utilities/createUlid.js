// @flow

import {
  factory as ulidFactory,
  detectPrng,
} from 'ulid';

const ulid = ulidFactory(detectPrng(true));

export default (): string => {
  return ulid();
};
