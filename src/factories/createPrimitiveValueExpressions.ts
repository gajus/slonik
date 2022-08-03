import safeStringify from 'fast-safe-stringify';
import {
  Logger,
} from '../Logger';
import {
  UnexpectedStateError,
} from '../errors';
import {
  type PrimitiveValueExpression,
} from '../types';

const log = Logger.child({
  namespace: 'createPrimitiveValueExpressions',
});

export const createPrimitiveValueExpressions = (values: readonly unknown[]): readonly PrimitiveValueExpression[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primitiveValueExpressions: Array<any[] | Buffer | boolean | number | string | null> = [];

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
        value: JSON.parse(safeStringify(value)),
        values: JSON.parse(safeStringify(values)),
      }, 'unexpected value expression');

      throw new UnexpectedStateError('Unexpected value expression.');
    }
  }

  return primitiveValueExpressions;
};
