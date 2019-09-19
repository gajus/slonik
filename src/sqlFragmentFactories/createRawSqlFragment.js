// @flow

import type {
  SqlFragmentType,
  SqlSqlTokenType,
} from '../types';
import {
  interpolatePositionalParameterReferences,
  interpolateNamedParameterReferences,
} from '../utilities';

export default (token: SqlSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  if (Array.isArray(token.values)) {
    return interpolatePositionalParameterReferences(token.sql, token.values, greatestParameterPosition);
  } else {
    // $FlowFixMe
    return interpolateNamedParameterReferences(token.sql, token.values, greatestParameterPosition);
  }
};
