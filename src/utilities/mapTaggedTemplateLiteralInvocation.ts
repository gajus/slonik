// @flow

import {
  SqlToken,
} from '../tokens';
import {
  PrimitiveValueExpressionType,
  TaggedTemplateLiteralInvocationType,
} from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (targetMethod: (sql: string, values: readonly PrimitiveValueExpressionType[]) => any) => {
  return <T>(query: TaggedTemplateLiteralInvocationType<T>) => {
    if (query.type !== SqlToken) {
      throw new TypeError('Query must be constructed using `sql` tagged template literal.');
    }

    return targetMethod(query.sql, query.values);
  };
};
