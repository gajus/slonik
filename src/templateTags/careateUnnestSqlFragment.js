// @flow

import type {
  SqlFragmentType,
  UnnestSqlTokenType
} from '../types';
import {
  escapeIdentifier
} from '../utilities';

export default (token: UnnestSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const columnTypes = token.columnTypes;

  const parameters = [];

  const unnestBindings = [];
  const unnsetSqlTokens = [];

  let columnIndex = 0;

  let placeholderIndex = greatestParameterPosition;

  while (columnIndex < columnTypes.length) {
    const columnType = columnTypes[columnIndex];

    unnsetSqlTokens.push('$' + ++placeholderIndex + '::' + escapeIdentifier(columnType) + '[]');

    unnestBindings[columnIndex] = [];

    columnIndex++;
  }

  let lastTupleSize;

  for (const tupleValues of token.tuples) {
    if (typeof lastTupleSize === 'number' && lastTupleSize !== tupleValues.length) {
      throw new Error('Each tuple in a list of tuples must have an equal number of members.');
    }

    if (tupleValues.length !== columnTypes.length) {
      throw new Error('Column types length must match tuple member length.');
    }

    lastTupleSize = tupleValues.length;

    let tupleColumnIndex = 0;

    for (const tupleValue of tupleValues) {
      unnestBindings[tupleColumnIndex++].push(tupleValue);
    }
  }

  parameters.push(...unnestBindings);

  const sql = 'unnest(' + unnsetSqlTokens.join(', ') + ')';

  return {
    parameters,
    sql
  };
};
