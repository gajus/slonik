// @flow

import type {
  AssignmentListSqlTokenType,
  SqlFragmentType,
} from '../types';
import {
  escapeIdentifier,
  isSqlToken,
} from '../utilities';
import {
  createSqlTokenSqlFragment,
} from '../factories';

export default (token: AssignmentListSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  let placeholderIndex = greatestParameterPosition;

  const values = [];

  const sql = Object
    .entries(token.namedAssignment)
    .map(([column, value]) => {
      if (isSqlToken(value)) {
        // $FlowFixMe
        const sqlFragment = createSqlTokenSqlFragment(value, placeholderIndex);

        placeholderIndex += sqlFragment.values.length;

        values.push(...sqlFragment.values);

        return escapeIdentifier(token.normalizeIdentifier(column)) + ' = ' + sqlFragment.sql;
      } else {
        // $FlowFixMe
        values.push(value);

        // @todo allow AssignmentListSqlTokenType key to be sql.identifier.
        // @see https://github.com/gajus/slonik/issues/53
        return escapeIdentifier(token.normalizeIdentifier(column)) + ' = $' + ++placeholderIndex;
      }
    })
    .join(', ');

  return {
    sql,
    values,
  };
};
