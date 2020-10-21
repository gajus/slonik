import {
  InvalidInputError,
} from '../errors';
import type {
  SqlFragmentType,
  UnnestSqlTokenType,
} from '../types';
import {
  countArrayDimensions,
  escapeIdentifier,
  isPrimitiveValueExpression,
  stripArrayNotation,
} from '../utilities';

export const createUnnestSqlFragment = (token: UnnestSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const columnTypes = token.columnTypes;

  const values = [];

  const unnestBindings = [];
  const unnestSqlTokens = [];

  let columnIndex = 0;

  let placeholderIndex = greatestParameterPosition;

  while (columnIndex < columnTypes.length) {
    const columnType = columnTypes[columnIndex];

    unnestSqlTokens.push(
      '$' +
      ++placeholderIndex +
      '::' +
      escapeIdentifier(stripArrayNotation(columnType)) +
      '[]'.repeat(countArrayDimensions(columnType) + 1),
    );

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
      if (!Array.isArray(tupleValue) && !isPrimitiveValueExpression(tupleValue) && !Buffer.isBuffer(tupleValue)) {
        throw new InvalidInputError('Invalid unnest tuple member type. Must be a primitive value expression.');
      }

      // @ts-expect-error
      unnestBindings[tupleColumnIndex++].push(tupleValue);
    }
  }

  values.push(...unnestBindings);

  const sql = 'unnest(' + unnestSqlTokens.join(', ') + ')';

  return {
    sql,
    values,
  };
};
