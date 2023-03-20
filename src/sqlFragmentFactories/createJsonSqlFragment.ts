import { InvalidInputError } from '../errors';
import { Logger } from '../Logger';
import {
  type JsonBinarySqlToken,
  type JsonSqlToken,
  type SqlFragment,
} from '../types';
import { safeStringify } from '../utilities';
import { isPlainObject } from 'is-plain-object';
import { serializeError } from 'serialize-error';

const log = Logger.child({
  namespace: 'createJsonSqlFragment',
});

export const createJsonSqlFragment = (
  token: JsonBinarySqlToken | JsonSqlToken,
  greatestParameterPosition: number,
  binary: boolean,
): SqlFragment => {
  let value;

  if (token.value === undefined) {
    throw new InvalidInputError('JSON payload must not be undefined.');
  } else if (token.value === null) {
    value = 'null';

    // @todo Deep check Array.
  } else if (
    !isPlainObject(token.value) &&
    !Array.isArray(token.value) &&
    !['number', 'string', 'boolean'].includes(typeof token.value)
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
      '$' +
      String(greatestParameterPosition + 1) +
      '::' +
      (binary ? 'jsonb' : 'json'),
    values: [value],
  };
};
