// @flow

import type {
  QueryIdType
} from '../types';
import createUlid from './createUlid';

export default (): QueryIdType => {
  // eslint-disable-next-line no-extra-parens, flowtype/no-weak-types
  return (createUlid(): any);
};
