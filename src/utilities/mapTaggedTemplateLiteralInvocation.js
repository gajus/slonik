// @flow

import type {
  TaggedTemplateLiteralInvocationType
} from '../types';
import QueryStore from '../QueryStore';

export default (targetMethod: *) => {
  return (query: TaggedTemplateLiteralInvocationType) => {
    if (QueryStore.get(query) !== true) {
      throw new TypeError('Query must be constructed using `sql` tagged template literal.');
    }

    return targetMethod(query.sql, query.values);
  };
};
