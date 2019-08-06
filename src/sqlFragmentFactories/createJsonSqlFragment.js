// @flow

import type {
  JsonSqlTokenType,
  SqlFragmentType,
} from '../types';
import {
  InvalidInputError,
} from '../errors';

export default (token: JsonSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  if (token.value === undefined) {
    throw new InvalidInputError('json value must not be undefined.');
  }

  // @todo Do not add `::json` as it will fail if an attempt is made to insert to jsonb-type column.
  return {
    sql: '$' + (greatestParameterPosition + 1),
    values: [
      token.value === null ? null : JSON.stringify(token.value),
    ],
  };
};
