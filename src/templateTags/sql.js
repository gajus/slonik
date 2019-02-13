// @flow

import type {
  IdentifierTokenType,
  PrimitiveValueExpressionType,
  RawSqlTokenType,
  SqlFragmentType,
  SqlSqlTokenType,
  SqlTaggedTemplateType,
  TupleListSqlTokenType,
  TupleSqlTokenType,
  UnnestSqlTokenType,
  ValueExpressionType,
  ValueListSqlTokenType
} from '../types';
import isPrimitiveValueExpression from '../utilities/isPrimitiveValueExpression';
import Logger from '../Logger';
import {
  createIdentifierSqlFragment,
  createRawSqlSqlFragment,
  createSqlSqlFragment,
  createTupleListSqlFragment,
  createTupleSqlFragment,
  createUnnestSqlFragment,
  createValueListSqlFragment
} from '../sqlFragmentFactories';

const log = Logger.child({
  namespace: 'sql'
});

// $FlowFixMe
const sql: SqlTaggedTemplateType = (
  parts: $ReadOnlyArray<string>,
  ...values: $ReadOnlyArray<ValueExpressionType>
): SqlSqlTokenType => {
  let rawSql = '';

  const parameters = [];

  let index = 0;

  const appendSqlFragment = (sqlFragment: SqlFragmentType) => {
    rawSql += sqlFragment.sql;
    parameters.push(...sqlFragment.parameters);
  };

  for (const part of parts) {
    const token = values[index++];

    rawSql += part;

    if (index >= parts.length) {
      continue;
    }

    if (isPrimitiveValueExpression(token)) {
      rawSql += '$' + (parameters.length + 1);

      parameters.push(token);
    } else if (token && token.type === 'SQL') {
      appendSqlFragment(createSqlSqlFragment(token, parameters.length));
    } else if (token && token.type === 'RAW_SQL') {
      appendSqlFragment(createRawSqlSqlFragment(token, parameters.length));
    } else if (token && token.type === 'IDENTIFIER') {
      appendSqlFragment(createIdentifierSqlFragment(token));
    } else if (token && token.type === 'VALUE_LIST') {
      appendSqlFragment(createValueListSqlFragment(token, parameters.length));
    } else if (token && token.type === 'TUPLE') {
      appendSqlFragment(createTupleSqlFragment(token, parameters.length));
    } else if (token && token.type === 'TUPLE_LIST') {
      appendSqlFragment(createTupleListSqlFragment(token, parameters.length));
    } else if (token && token.type === 'UNNEST') {
      appendSqlFragment(createUnnestSqlFragment(token, parameters.length));
    } else {
      log.error({
        constructedSql: rawSql,
        offendingToken: token
      }, 'unexpected value expression');

      throw new TypeError('Unexpected value expression.');
    }
  }

  return {
    sql: rawSql,
    type: 'SQL',
    values: parameters
  };
};

sql.identifier = (
  names: $ReadOnlyArray<string>
): IdentifierTokenType => {
  // @todo Replace `type` with a symbol once Flow adds symbol support
  // @see https://github.com/facebook/flow/issues/810
  return {
    names,
    type: 'IDENTIFIER'
  };
};

sql.raw = (
  rawSql: string,
  values?: $ReadOnlyArray<PrimitiveValueExpressionType>
): RawSqlTokenType => {
  return {
    sql: rawSql,
    type: 'RAW_SQL',
    values: values || []
  };
};

sql.valueList = (
  values: $ReadOnlyArray<PrimitiveValueExpressionType>
): ValueListSqlTokenType => {
  return {
    type: 'VALUE_LIST',
    values
  };
};

sql.tuple = (
  values: $ReadOnlyArray<PrimitiveValueExpressionType>
): TupleSqlTokenType => {
  return {
    type: 'TUPLE',
    values
  };
};

sql.tupleList = (
  tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>
): TupleListSqlTokenType => {
  return {
    tuples,
    type: 'TUPLE_LIST'
  };
};

sql.unnest = (
  tuples: $ReadOnlyArray<$ReadOnlyArray<PrimitiveValueExpressionType>>,
  columnTypes: $ReadOnlyArray<string>
): UnnestSqlTokenType => {
  return {
    columnTypes,
    tuples,
    type: 'UNNEST'
  };
};

export default sql;
