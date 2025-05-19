import { Logger } from '../Logger.js';
import type { PrimitiveValueExpression } from '../types.js';
import { safeStringify } from '../utilities/safeStringify.js';
import { UnexpectedStateError } from '@slonik/errors';

const log = Logger.child({
  namespace: 'createPrimitiveValueExpressions',
});

export const createPrimitiveValueExpressions = (
  values: readonly unknown[],
): readonly PrimitiveValueExpression[] => {
  const primitiveValueExpressions: Array<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any[] | bigint | boolean | Buffer | null | number | string
  > = [];

  for (const value of values) {
    if (
      Array.isArray(value) ||
      Buffer.isBuffer(value) ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint' ||
      value === null
    ) {
      primitiveValueExpressions.push(value);
    } else {
      log.warn(
        {
          value: JSON.parse(safeStringify(value)),
          values: JSON.parse(safeStringify(values)),
        },
        'unexpected value expression',
      );

      throw new UnexpectedStateError('Unexpected value expression.');
    }
  }

  return primitiveValueExpressions;
};
