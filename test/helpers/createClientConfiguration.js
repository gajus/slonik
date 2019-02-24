// @flow

import type {
  ClientConfigurationType
} from '../../src/types';

export default (): ClientConfigurationType => {
  return {
    captureStackTrace: true,
    interceptors: [],
    typeParsers: []
  };
};
