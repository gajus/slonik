// @flow

import type {
  SqlFragmentType,
  ArraySqlTokenType
} from '../types';
import {
  escapeIdentifier
} from '../utilities';

export default (token: ArraySqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  const values = [
    token.values
  ];

  const sql = '$' + (greatestParameterPosition + 1) + '::' + escapeIdentifier(token.memberType) + '[]';

  return {
    sql,

    // $FlowFixMe
    values
  };
};
