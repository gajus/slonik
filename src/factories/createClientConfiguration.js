// @flow

import {
  createLogInterceptor
} from '../interceptors';
import type {
  ClientConfigurationType,
  ClientUserConfigurationType
} from '../types';
import createTypeParserPreset from './createTypeParserPreset';

export default (clientUserConfiguration?: ClientUserConfigurationType): ClientConfigurationType => {
  let configuration = {
    ...clientUserConfiguration
  };

  if (!configuration.typeParsers) {
    configuration.typeParsers = createTypeParserPreset();
  }

  configuration = {
    ...configuration,
    interceptors: [
      createLogInterceptor(),
      ...configuration.interceptors || []
    ]
  };

  return configuration;
};
