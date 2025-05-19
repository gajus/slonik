import { Logger } from '../Logger.js';
import { FragmentToken } from '../tokens.js';
import {
  type JsonBinarySqlToken,
  type JsonSqlToken,
  type SqlFragmentToken,
} from '../types.js';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder.js';
import { isPlainObject } from '../utilities/isPlainObject.js';
import { safeStringify } from '../utilities/safeStringify.js';
import { InvalidInputError } from '@slonik/errors';
import { serializeError } from 'serialize-error';

const log = Logger.child({
  namespace: 'createJsonSqlFragment',
});

export const createJsonSqlFragment = (
  token: JsonBinarySqlToken | JsonSqlToken,
  greatestParameterPosition: number,
  binary: boolean,
): SqlFragmentToken => {
  let value;

  if (token.value === undefined) {
    throw new InvalidInputError('JSON payload must not be undefined.');
  } else if (token.value === null) {
    value = 'null';

    // @todo Deep check Array.
  } else if (
    !isPlainObject(token.value) &&
    !Array.isArray(token.value) &&
    !['boolean', 'number', 'string'].includes(typeof token.value)
  ) {
    throw new InvalidInputError(
      'JSON payload must be a primitive value or a plain object.',
    );
  } else {
    try {
      value = safeStringify(token.value);
    } catch (error) {
      log.error(
        {
          error: serializeError(error),
        },
        'payload cannot be stringified',
      );

      throw new InvalidInputError('JSON payload cannot be stringified.');
    }

    if (value === undefined) {
      throw new InvalidInputError(
        'JSON payload cannot be stringified. The resulting value is undefined.',
      );
    }
  }

  return {
    sql:
      formatSlonikPlaceholder(greatestParameterPosition + 1) +
      '::' +
      (binary ? 'jsonb' : 'json'),
    type: FragmentToken,
    values: [value],
  };
};
