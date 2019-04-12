// @flow

import type {
  BooleanExpressionTokenType,
  SqlFragmentType
} from '../types';
import {
  isSqlToken
} from '../utilities';
import {
  createSqlTokenSqlFragment
} from '../factories';
import {
  UnexpectedStateError
} from '../errors';

export default (token: BooleanExpressionTokenType, greatestParameterPosition: number): SqlFragmentType => {
  if (token.operator !== 'AND' && token.operator !== 'OR') {
    throw new UnexpectedStateError('Invalid operator.');
  }

  const values = [];
  const placeholders = [];

  let placeholderIndex = greatestParameterPosition;

  for (const member of token.members) {
    if (isSqlToken(member)) {
      // $FlowFixMe
      const sqlFragment = createSqlTokenSqlFragment(member, placeholderIndex);

      placeholders.push(sqlFragment.sql);
      placeholderIndex += sqlFragment.values.length;

      values.push(...sqlFragment.values);
    } else {
      placeholders.push('$' + ++placeholderIndex);

      // $FlowFixMe
      values.push(member);
    }
  }

  return {
    sql: '(' + placeholders.join(' ' + token.operator + ' ') + ')',
    values
  };
};
