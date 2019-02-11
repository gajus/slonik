// @flow

import type {
  SqlFragmentType,
  TupleListSqlTokenType
} from '../types';

export default (token: TupleListSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const parameters = [];

  let placeholderIndex = greatestParameterPosition;

  const tupleListMemberSql = [];

  let lastTupleSize;

  for (const tuple of token.tuples) {
    const placeholders = [];

    if (typeof lastTupleSize === 'number' && lastTupleSize !== tuple.length) {
      throw new Error('Each tuple in a list of tuples must have an equal number of members.');
    }

    lastTupleSize = tuple.length;

    for (const member of tuple) {
      placeholders.push('$' + ++placeholderIndex);

      parameters.push(member);
    }

    tupleListMemberSql.push('(' + placeholders.join(', ') + ')');
  }

  const sql = tupleListMemberSql.join(', ');

  return {
    parameters,
    sql
  };
};
