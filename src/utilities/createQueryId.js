// @flow

import {
  factory as ulidFactory,
  detectPrng
} from 'ulid';
import type {
  QueryIdType
} from '../types';

export default (): QueryIdType => {
  return ulidFactory(detectPrng(true));
};
