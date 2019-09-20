// @flow

import type {
  SqlFragmentType,
  ListSqlTokenType,
} from '../types';
import {
  UnexpectedStateError,
} from '../errors';
import {
  isSqlToken,
} from '../utilities';
import {
  createPrimitiveValueExpressions,
  createSqlTokenSqlFragment,
} from '../factories';

export default (token: ListSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const values = [];
  const placeholders = [];

  let placeholderIndex = greatestParameterPosition;

  if (token.members.length === 0) {
    throw new UnexpectedStateError('Value list must have at least 1 member.');
  }

  for (const member of token.members) {
    if (isSqlToken(member)) {
      // $FlowFixMe
      const sqlFragment = createSqlTokenSqlFragment(member, placeholderIndex);

      placeholders.push(sqlFragment.sql);
      placeholderIndex += sqlFragment.values.length;
      values.push(...sqlFragment.values);
    } else {
      placeholders.push('$' + ++placeholderIndex);

      values.push(member);
    }
  }

  return {
    // $FlowFixMe
    sql: placeholders.join(token.glue.sql),
    values: createPrimitiveValueExpressions(values),
  };
};
