// @flow

import type {
  JsonSqlTokenType,
  SqlFragmentType
} from '../types';

export default (token: JsonSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  return {
    sql: '$' + (greatestParameterPosition + 1) + '::"json"',
    values: [
      JSON.stringify(token.value)
    ]
  };
};
