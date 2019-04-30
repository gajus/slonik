// @flow

import type {
  SqlFragmentType,
  TupleSqlTokenType
} from '../types';
import {
  UnexpectedStateError
} from '../errors';
import {
  isSqlToken
} from '../utilities';
import {
  createPrimitiveValueExpressions,
  createSqlTokenSqlFragment
} from '../factories';

export default (token: TupleSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const values = [];
  const placeholders = [];

  let placeholderIndex = greatestParameterPosition;

  if (token.values.length === 0) {
    throw new UnexpectedStateError('Tuple must have at least 1 member.');
  }

  for (const tupleValue of token.values) {
    if (isSqlToken(tupleValue)) {
      // $FlowFixMe
      const sqlFragment = createSqlTokenSqlFragment(tupleValue, placeholderIndex);

      placeholders.push(sqlFragment.sql);
      placeholderIndex += sqlFragment.values.length;
      values.push(...sqlFragment.values);
    } else {
      placeholders.push('$' + ++placeholderIndex);

      values.push(tupleValue);
    }
  }

  const sql = '(' + placeholders.join(', ') + ')';

  return {
    sql,
    values: createPrimitiveValueExpressions(values)
  };
};
