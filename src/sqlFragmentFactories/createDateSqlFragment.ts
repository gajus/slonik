import {
  InvalidInputError,
} from '../errors';
import {
  type DateSqlToken,
  type SqlFragment,
} from '../types';

export const createDateSqlFragment = (token: DateSqlToken, greatestParameterPosition: number): SqlFragment => {
  if (!(token.date instanceof Date)) {
    throw new InvalidInputError('Date parameter value must be an instance of Date.');
  }

  return {
    sql: '$' + String(greatestParameterPosition + 1) + '::date',
    values: [
      token.date.toISOString().slice(0, 10),
    ],
  };
};
