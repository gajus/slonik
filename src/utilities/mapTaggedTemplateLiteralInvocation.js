// @flow

import type {
  TaggedTemplateLiteralInvocationType
} from '../types';

export default (targetMethod: *) => {
  return (query: TaggedTemplateLiteralInvocationType) => {
    if (typeof query === 'string') {
      throw new TypeError('Query must be constructed using `sql` tagged template literal.');
    }

    return targetMethod(query.sql, query.values);
  };
};
