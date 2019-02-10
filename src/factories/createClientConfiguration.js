// @flow

import createFieldNameTransformationInterceptor from '../interceptors/createFieldNameTransformationInterceptor';
import createLogInterceptor from '../interceptors/createLogInterceptor';
import createQueryNormalizationInterceptor from '../interceptors/createQueryNormalizationInterceptor';
import createBenchmarkingInterceptor from '../interceptors/createBenchmarkingInterceptor';
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
