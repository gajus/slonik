// @flow

import type {
  QueryIdType,
} from '../types';
import createUlid from './createUlid';

export default (): QueryIdType => {
  // eslint-disable-next-line no-extra-parens, @typescript-eslint/no-explicit-any
  return createUlid() as any;
};
