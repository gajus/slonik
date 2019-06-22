// @flow

import {
  snakeCase
} from 'lodash';

export default (propertyName: string): string => {
  return snakeCase(propertyName);
};
