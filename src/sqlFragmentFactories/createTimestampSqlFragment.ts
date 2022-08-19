import {
  InvalidInputError,
} from '../errors';
import {
  type TimestampSqlToken,
  type SqlFragment,
} from '../types';

export const createTimestampSqlFragment = (token: TimestampSqlToken, greatestParameterPosition: number): SqlFragment => {
  if (!(token.date instanceof Date)) {
    throw new InvalidInputError('Timestamp parameter value must be an instance of Date.');
  }

  return {
    sql: 'to_timestamp($' + String(greatestParameterPosition + 1) + ')',
    values: [
      String(token.date.getTime() / 1_000),
    ],
  };
};
