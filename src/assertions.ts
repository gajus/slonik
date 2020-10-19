// @flow

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const assertSqlSqlToken = (subject: any) => {
  if (typeof subject !== 'object' || subject === null || subject.type !== 'SLONIK_TOKEN_SQL') {
    throw new TypeError('Query must be constructed using `sql` tagged template literal.');
  }
};
