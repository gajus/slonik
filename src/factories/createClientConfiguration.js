// @flow

import {
  createBenchmarkingInterceptor,
  createFieldNameTransformationInterceptor,
  createLogInterceptor,
  createQueryNormalizationInterceptor
} from '../interceptors';
import type {
  ClientConfigurationType,
  ClientUserConfigurationType
} from '../types';

export default (clientUserConfiguration?: ClientUserConfigurationType): ClientConfigurationType => {
  let configuration = {
    interceptors: [
      createQueryNormalizationInterceptor(),
      createFieldNameTransformationInterceptor({
        format: 'CAMEL_CASE'
      }),
      createBenchmarkingInterceptor()
    ],
    ...clientUserConfiguration
  };

  configuration = {
    ...configuration,
    interceptors: [
      createLogInterceptor(),
      ...configuration.interceptors
    ]
  };

  return configuration;
};
