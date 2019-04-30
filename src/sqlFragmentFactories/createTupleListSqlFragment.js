// @flow

import type {
  SqlFragmentType,
  TupleListSqlTokenType
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

export default (token: TupleListSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const values = [];

  let placeholderIndex = greatestParameterPosition;

  const tupleListMemberSql = [];

  let lastTupleSize;

  for (const tuple of token.tuples) {
    const placeholders = [];

    if (tuple.length === 0) {
      throw new UnexpectedStateError('Tuple must have at least 1 member.');
    }

    if (typeof lastTupleSize === 'number' && lastTupleSize !== tuple.length) {
      throw new UnexpectedStateError('Each tuple in a list of tuples must have an equal number of members.');
    }

    lastTupleSize = tuple.length;

    for (const member of tuple) {
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

    tupleListMemberSql.push('(' + placeholders.join(', ') + ')');
  }

  const sql = tupleListMemberSql.join(', ');

  return {
    sql,
    values: createPrimitiveValueExpressions(values)
  };
};
