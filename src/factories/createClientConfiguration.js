// @flow

import {
  createLogInterceptor
} from '../interceptors';
import type {
  ClientConfigurationType,
  ClientUserConfigurationType
} from '../types';
import createInterceptorPreset from './createInterceptorPreset';

export default (clientUserConfiguration?: ClientUserConfigurationType): ClientConfigurationType => {
  let configuration = {
    ...clientUserConfiguration
  };

  if (!configuration.interceptors) {
    configuration.interceptors = createInterceptorPreset();
  }

  configuration = {
    ...configuration,
    interceptors: [
      createLogInterceptor(),
      ...configuration.interceptors
    ]
  };

  return configuration;
};
