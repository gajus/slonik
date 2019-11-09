// @flow

import type {
  PrimitiveValueExpressionType,
} from '../types';

/**
 * @see https://github.com/brianc/node-postgres/issues/980
 * @see https://github.com/brianc/node-pg-native/issues/83
 */
export default (queryValues: $ReadOnlyArray<PrimitiveValueExpressionType>, native: boolean): $ReadOnlyArray<PrimitiveValueExpressionType> => {
  if (native && queryValues) {
    const finalValues = [];

    for (const value of queryValues) {
      if (Buffer.isBuffer(value)) {
        // $FlowFixMe
        finalValues.push('\\x' + value.toString('hex'));
      } else {
        finalValues.push(value);
      }
    }

    return finalValues;
  }

  return queryValues;
};
