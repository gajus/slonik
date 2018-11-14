// @flow

import {
  factory as ulidFactory,
  detectPrng
} from 'ulid';

export default (): string => {
  return ulidFactory(detectPrng(true));
};
