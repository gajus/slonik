// @flow

import type {
  TaggedTemplateLiteralInvocationType
} from '../types';
import {
  SqlTokenSymbol
} from '../symbols';

export default (targetMethod: *) => {
  return (query: TaggedTemplateLiteralInvocationType) => {
    if (query.type !== SqlTokenSymbol) {
      throw new TypeError('Query must be constructed using `sql` tagged template literal.');
    }

    return targetMethod(query.sql, query.values);
  };
};
