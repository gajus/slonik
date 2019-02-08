// @flow

import type {
  DatabaseQueryValuesType,
  TaggledTemplateLiteralInvocationType
} from '../types';

export default (targetMethod: *) => {
  return (query: TaggledTemplateLiteralInvocationType, values: DatabaseQueryValuesType = []) => {
    if (typeof query === 'string') {
      throw new TypeError('Query must be constructed using `sql` tagged template literal.');
    }

    if (!Array.isArray(values)) {
      throw new TypeError('Unexpected state.');
    }

    return targetMethod(query.sql, query.values.concat(values));
  };
};
