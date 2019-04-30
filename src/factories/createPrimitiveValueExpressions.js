// @flow

import {
  UnexpectedStateError
} from '../errors';
import type {
  PrimitiveValueExpressionType
} from '../types';

export default (values: $ReadOnlyArray<*>): $ReadOnlyArray<PrimitiveValueExpressionType> => {
  const primitiveValueExpressions = [];

  for (const value of values) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
      primitiveValueExpressions.push(value);
    } else {
      throw new UnexpectedStateError('Unexpected value expression.');
    }
  }

  return primitiveValueExpressions;
};
