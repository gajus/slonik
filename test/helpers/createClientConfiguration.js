// @flow

import type {
  ClientConfigurationType
} from '../../src/types';

export default (): ClientConfigurationType => {
  return {
    interceptors: [],
    typeParsers: []
  };
};
