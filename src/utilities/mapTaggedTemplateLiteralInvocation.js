// @flow

import {
  SqlToken,
} from '../tokens';
import type {
  TaggedTemplateLiteralInvocationType,
} from '../types';

export default (targetMethod: *) => {
  return (query: TaggedTemplateLiteralInvocationType) => {
    if (query.type !== SqlToken) {
      throw new TypeError('Query must be constructed using `sql` tagged template literal.');
    }

    return targetMethod(query.sql, query.values);
  };
};
