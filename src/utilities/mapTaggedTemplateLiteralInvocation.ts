// @flow

import {
  SqlToken,
} from '../tokens';
import type {
  TaggedTemplateLiteralInvocationType,
} from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (targetMethod: any) => {
  return (query: TaggedTemplateLiteralInvocationType) => {
    if (query.type !== SqlToken) {
      throw new TypeError('Query must be constructed using `sql` tagged template literal.');
    }

    return targetMethod(query.sql, query.values);
  };
};
