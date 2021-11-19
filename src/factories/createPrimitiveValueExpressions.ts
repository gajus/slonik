import {
  Logger,
} from '../Logger';
import {
  UnexpectedStateError,
} from '../errors';
import type {
  PrimitiveValueExpressionType,
} from '../types';

const log = Logger.child({
  namespace: 'createPrimitiveValueExpressions',
});

export const createPrimitiveValueExpressions = (values: readonly unknown[]): readonly PrimitiveValueExpressionType[] => {
  const primitiveValueExpressions = [];

  for (const value of values) {
    if (Array.isArray(value) ||
        Buffer.isBuffer(value) ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === null
    ) {
      primitiveValueExpressions.push(value);
    } else {
      log.warn({
        value: JSON.parse(JSON.stringify(value)),
        values: JSON.parse(JSON.stringify(values)),
      }, 'unexpected value expression');

      throw new UnexpectedStateError('Unexpected value expression.');
    }
  }

  return primitiveValueExpressions;
};
