// @flow

import type {
  DatabaseQueryValuesType,
  TaggledTemplateLiteralInvocationType
} from '../types';

export default (targetMethod: *) => {
  return (maybeQuery: string | TaggledTemplateLiteralInvocationType, values: DatabaseQueryValuesType = []) => {
    if (typeof maybeQuery === 'string') {
      return targetMethod(maybeQuery, values);
    } else {
      if (!Array.isArray(values)) {
        throw new TypeError('Unexpected state.');
      }

      return targetMethod(maybeQuery.sql, maybeQuery.values.concat(values));
    }
  };
};
