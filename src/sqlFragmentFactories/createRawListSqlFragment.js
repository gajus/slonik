// @flow

import type {
  SqlFragmentType,
  RawListSqlTokenType,
} from '../types';
import {
  InvalidInputError,
} from '../errors';
import {
  isSqlToken,
} from '../utilities';
import {
  createPrimitiveValueExpressions,
  createSqlTokenSqlFragment,
} from '../factories';

export default (token: RawListSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const values = [];

  let placeholderIndex = greatestParameterPosition;

  const tokenListSqlMembers = [];

  for (const memberToken of token.tokens) {
    if (!isSqlToken(memberToken) || memberToken.type !== 'SLONIK_TOKEN_RAW') {
      throw new InvalidInputError();
    }

    const sqlFragment = createSqlTokenSqlFragment(memberToken, placeholderIndex);

    tokenListSqlMembers.push(sqlFragment.sql);
    placeholderIndex += sqlFragment.values.length;
    values.push(...sqlFragment.values);
  }

  const sql = tokenListSqlMembers.join(', ');

  return {
    sql,
    values: createPrimitiveValueExpressions(values),
  };
};
