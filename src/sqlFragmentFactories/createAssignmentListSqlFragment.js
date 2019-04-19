// @flow

import {
  snakeCase
} from 'lodash';
import type {
  AssignmentListTokenType,
  SqlFragmentType
} from '../types';
import {
  escapeIdentifier,
  isSqlToken
} from '../utilities';
import {
  createSqlTokenSqlFragment
} from '../factories';

export default (token: AssignmentListTokenType, greatestParameterPosition: number): SqlFragmentType => {
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

        return escapeIdentifier(snakeCase(column)) + ' = ' + sqlFragment.sql;
      } else {
        // $FlowFixMe
        values.push(value);

        // @todo `snakeCase` is opinionated modification assignment expression modification.
        // Add a way to override the default behaviour, e.g. by allowing AssignmentListTokenType
        // key to be sql.identifier.
        return escapeIdentifier(snakeCase(column)) + ' = $' + ++placeholderIndex;
      }
    })
    .join(', ');

  return {
    sql,
    values
  };
};
