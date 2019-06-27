// @flow

import type {
  JsonSqlTokenType,
  SqlFragmentType
} from '../types';

export default (token: JsonSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  // @todo Do not add `::json` as it will fail if an attempt is made to insert to jsonb-type column.
  return {
    sql: '$' + (greatestParameterPosition + 1),
    values: [
      JSON.stringify(token.value)
    ]
  };
};
