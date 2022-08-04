import {
  type SqlSqlToken,
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySqlSqlToken = SqlSqlToken<any>;

export const assertSqlSqlToken = (subject: AnySqlSqlToken | null): void => {
  if (typeof subject !== 'object' || subject === null || subject.type !== 'SLONIK_TOKEN_SQL') {
    throw new TypeError('Query must be constructed using `sql` tagged template literal.');
  }
};
