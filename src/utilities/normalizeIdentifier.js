// @flow

import {
  snakeCase
} from 'lodash';
import type {
  IdentifierNormalizerType
} from '../types';

const normalizeIdentifier: IdentifierNormalizerType = (propertyName: string): string => {
  return snakeCase(propertyName);
};

export default normalizeIdentifier;
