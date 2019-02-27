// @flow

import type {
  RawSqlTokenType,
  SqlFragmentType
} from '../types';
import {
  normalizePositionalParameterReferences,
  normalizeNamedParameterReferences
} from '../utilities';

export default (token: RawSqlTokenType, greatestParameterPosition: number): SqlFragmentType => {
  if (Array.isArray(token.values)) {
    return normalizePositionalParameterReferences(token.sql, token.values, greatestParameterPosition);
  } else {
    return normalizeNamedParameterReferences(token.sql, token.values, greatestParameterPosition);
  }
};
