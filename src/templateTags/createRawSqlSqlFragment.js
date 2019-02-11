// @flow

import type {
  RawSqlTokenType,
  SqlFragmentType
} from '../types';

export default (token: RawSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  let sql = '';

  const parameters = [];

  if (Array.isArray(token.values) && token.values.length) {
    const fragmentValues = token.values;

    sql += token.sql.replace(/\$(\d+)/, (match, g1) => {
      return '$' + (parseInt(g1, 10) + greatestParameterPosition);
    });

    for (const fragmentValue of fragmentValues) {
      parameters.push(fragmentValue);
    }
  } else {
    sql += token.sql;
  }

  return {
    parameters,
    sql
  };
};
