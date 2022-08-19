import {
  InvalidInputError,
} from '../errors';
import {
  type TimestampSqlToken,
  type SqlFragment,
} from '../types';

export const createTimestampSqlFragment = (token: TimestampSqlToken, greatestParameterPosition: number): SqlFragment => {
  if (!(token.date instanceof Date)) {
    throw new InvalidInputError('Timestamp value must be a Date.');
  }

  return {
    sql: 'to_timestamp($' + String(greatestParameterPosition + 1) + ')',
    values: [
      String(token.date.getTime() / 1_000),
    ],
  };
};
