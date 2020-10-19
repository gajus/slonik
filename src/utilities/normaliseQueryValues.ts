// @flow

import type {
  PrimitiveValueExpressionType,
} from '../types';

export default (queryValues: ReadonlyArray<PrimitiveValueExpressionType>, native: boolean): ReadonlyArray<PrimitiveValueExpressionType> => {
  if (native && queryValues) {
    const finalValues = [];

    for (const value of queryValues) {
      // Property handle binary/ bytea inserts.
      // @see https://github.com/brianc/node-postgres/issues/980
      // @see https://github.com/brianc/node-pg-native/issues/83
      if (Buffer.isBuffer(value)) {
        // @ts-ignore
        finalValues.push('\\x' + value.toString('hex'));
      } else {
        finalValues.push(value);
      }
    }

    return finalValues;
  }

  return queryValues;
};
