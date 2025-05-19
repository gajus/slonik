import { Logger } from '../Logger.js';
import { type NamedParameterValues } from '../types.js';
import { interpolatePositionalParameterReferences } from './interpolatePositionalParameterReferences.js';
import { type ValueExpression } from '@slonik/sql-tag';
import { difference } from 'lodash';
import { type FragmentSqlToken, InvalidInputError } from 'slonik';

const log = Logger.child({
  namespace: 'interpolateNamedParameterReferences',
});

/**
 * @see https://regex101.com/r/KrEe8i/2
 */
const namedPlaceholderRegex = /[\s(,]:([_a-z]+)/gu;

/**
 * @see https://github.com/mysqljs/sqlstring/blob/f946198800a8d7f198fcf98d8bb80620595d01ec/lib/SqlString.js#L73
 */
export const interpolateNamedParameterReferences = (
  inputSql: string,
  inputValues: NamedParameterValues = {},
): FragmentSqlToken => {
  const resultValues: ValueExpression[] = [];
  const parameterNames = Object.keys(inputValues);

  for (const parameterName of parameterNames) {
    const parameterValue = inputValues[parameterName];

    resultValues.push(parameterValue);
  }

  const usedParameterNames = [] as string[];

  const resultSql = inputSql.replaceAll(namedPlaceholderRegex, (match, g1) => {
    if (!parameterNames.includes(g1)) {
      throw new InvalidInputError(
        'Named parameter reference does not have a matching value.',
      );
    }

    usedParameterNames.push(g1);

    const parameterIndex = parameterNames.indexOf(g1) + 1;

    return match.slice(0, -g1.length - 1) + `$slonik_${parameterIndex}`;
  });

  const unusedParameterNames = difference(parameterNames, usedParameterNames);

  if (unusedParameterNames.length > 0) {
    log.warn(
      {
        unusedParameterNames,
      },
      'unused parameter names',
    );

    throw new InvalidInputError(
      'Values object contains value(s) not present as named parameter references in the query.',
    );
  }

  return interpolatePositionalParameterReferences(resultSql, resultValues);
};
