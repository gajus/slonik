// @flow

import type {
  TimestampSqlTokenType,
  SqlFragmentType,
} from '../types';
import {
  InvalidInputError,
} from '../errors';

export default (token: TimestampSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  if (typeof token.milliseconds !== 'number') {
    throw new InvalidInputError('sql.timestamp parameter must be a number (milliseconds since epoch)');
  }

  const sql = `to_timestamp($${ greatestParameterPosition + 1 })`;

  return {
    sql,
    values: [token.milliseconds / 1000],
  };
};
