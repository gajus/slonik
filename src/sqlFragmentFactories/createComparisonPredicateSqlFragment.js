// @flow

import type {
  ComparisonPredicateTokenType,
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

export type ComparisonOperatorType = '<' | '>' | '<=' | '>=' | '=' | '<>' | '!=';

export default (token: ComparisonPredicateTokenType, greatestParameterPosition: number): SqlFragmentType => {
  if (
    token.operator !== '<' &&
    token.operator !== '>' &&
    token.operator !== '<=' &&
    token.operator !== '>=' &&
    token.operator !== '=' &&
    token.operator !== '<>' &&
    token.operator !== '!='
  ) {
    throw new UnexpectedStateError('Invalid operator.');
  }

  const values = [];
  const placeholders = [];

  let placeholderIndex = greatestParameterPosition;

  if (isSqlToken(token.leftOperand)) {
    // $FlowFixMe
    const sqlFragment = createSqlTokenSqlFragment(token.leftOperand, placeholderIndex);

    placeholders.push(sqlFragment.sql);
    placeholderIndex += sqlFragment.values.length;

    values.push(...sqlFragment.values);
  } else {
    placeholders.push('$' + ++placeholderIndex);

    // $FlowFixMe
    values.push(token.leftOperand);
  }

  placeholders.push(token.operator);

  if (isSqlToken(token.rightOperand)) {
    // $FlowFixMe
    const sqlFragment = createSqlTokenSqlFragment(token.rightOperand, placeholderIndex);

    placeholders.push(sqlFragment.sql);
    placeholderIndex += sqlFragment.values.length;

    values.push(...sqlFragment.values);
  } else {
    placeholders.push('$' + ++placeholderIndex);

    // $FlowFixMe
    values.push(token.rightOperand);
  }

  return {
    sql: placeholders.join(' '),
    values
  };
};
