// @flow

import type {
  ArraySqlTokenType,
  SqlFragmentType,
} from '../types';
import {
  escapeIdentifier,
  isSqlToken,
} from '../utilities';
import {
  createSqlTokenSqlFragment,
} from '../factories';
import {
  UnexpectedStateError,
} from '../errors';

export default (token: ArraySqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  let placeholderIndex = greatestParameterPosition;

  const values = [
    token.values,
  ];

  placeholderIndex++;

  let sql = '$' + placeholderIndex + '::';

  if (isSqlToken(token.memberType) && token.memberType.type === 'SLONIK_TOKEN_RAW') {
    // $FlowFixMe
    const sqlFragment = createSqlTokenSqlFragment(token.memberType, placeholderIndex);

    placeholderIndex += sqlFragment.values.length;

    values.push(...sqlFragment.values);

    sql += sqlFragment.sql;
  } else if (typeof token.memberType === 'string') {
    sql += escapeIdentifier(token.memberType) + '[]';
  } else {
    throw new UnexpectedStateError('Unsupported `memberType`. `memberType` must be a string or SqlToken of "SLONIK_TOKEN_RAW" type.');
  }

  return {
    sql,

    // $FlowFixMe
    values,
  };
};
