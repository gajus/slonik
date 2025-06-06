import { FragmentToken } from '../tokens.js';
import type {
  PrimitiveValueExpression,
  SqlFragmentToken,
  UnnestSqlToken,
} from '../types.js';
import { countArrayDimensions } from '../utilities/countArrayDimensions.js';
import { escapeIdentifier } from '../utilities/escapeIdentifier.js';
import { formatSlonikPlaceholder } from '../utilities/formatSlonikPlaceholder.js';
import { isPrimitiveValueExpression } from '../utilities/isPrimitiveValueExpression.js';
import { stripArrayNotation } from '../utilities/stripArrayNotation.js';
import { InvalidInputError } from '@slonik/errors';

export const createUnnestSqlFragment = (
  token: UnnestSqlToken,
  greatestParameterPosition: number,
): SqlFragmentToken => {
  const { columnTypes } = token;

  const values: PrimitiveValueExpression[] = [];

  const unnestBindings: PrimitiveValueExpression[][] = [];
  const unnestSqlTokens: string[] = [];

  let columnIndex = 0;

  let placeholderIndex = greatestParameterPosition;

  while (columnIndex < columnTypes.length) {
    const typeMember = columnTypes[columnIndex];

    let columnType = columnTypes[columnIndex];
    let columnTypeIsIdentifier;

    if (typeof typeMember === 'string') {
      columnType = typeMember;
      columnTypeIsIdentifier = false;
    } else if (Array.isArray(typeMember)) {
      columnType = typeMember
        .map((identifierName) => {
          if (typeof identifierName !== 'string') {
            throw new InvalidInputError(
              'sql.unnest column identifier name array member type must be a string (type name identifier) or a SQL token.',
            );
          }

          return escapeIdentifier(identifierName);
        })
        .join('.');
      columnTypeIsIdentifier = true;
    } else {
      columnType = typeMember.sql;
      columnTypeIsIdentifier = true;
    }

    unnestSqlTokens.push(
      formatSlonikPlaceholder(++placeholderIndex) +
        '::' +
        (columnTypeIsIdentifier
          ? stripArrayNotation(columnType)
          : escapeIdentifier(stripArrayNotation(columnType))) +
        '[]'.repeat(countArrayDimensions(columnType) + 1),
    );

    unnestBindings[columnIndex] = [];

    columnIndex++;
  }

  let lastTupleSize;

  for (const tupleValues of token.tuples) {
    if (
      typeof lastTupleSize === 'number' &&
      lastTupleSize !== tupleValues.length
    ) {
      throw new Error(
        'Each tuple in a list of tuples must have an equal number of members.',
      );
    }

    if (tupleValues.length !== columnTypes.length) {
      throw new Error('Column types length must match tuple member length.');
    }

    lastTupleSize = tupleValues.length;

    let tupleColumnIndex = 0;

    for (const tupleValue of tupleValues) {
      if (
        !Array.isArray(tupleValue) &&
        !isPrimitiveValueExpression(tupleValue) &&
        !Buffer.isBuffer(tupleValue)
      ) {
        throw new InvalidInputError(
          'Invalid unnest tuple member type. Must be a primitive value expression.',
        );
      }

      const tupleBindings = unnestBindings[tupleColumnIndex++];

      if (!tupleBindings) {
        throw new Error('test');
      }

      tupleBindings.push(tupleValue);
    }
  }

  values.push(...unnestBindings);

  const sql = 'unnest(' + unnestSqlTokens.join(', ') + ')';

  return {
    sql,
    type: FragmentToken,
    values,
  };
};
