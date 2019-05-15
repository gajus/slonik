// @flow

import type {
  SqlFragmentType,
  ArraySqlTokenType
} from '../types';

export default (token: ArraySqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const values = [
    token.values
  ];

  const sql = '$' + (greatestParameterPosition + 1) + '::' + token.memberType + '[]';

  return {
    sql,

    // $FlowFixMe
    values
  };
};
