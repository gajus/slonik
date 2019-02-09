// @flow

import createFieldNameTransformationInterceptor from '../interceptors/createFieldNameTransformationInterceptor';
import createLogInterceptor from '../interceptors/createLogInterceptor';
import createQueryNormalizationInterceptor from '../interceptors/createQueryNormalizationInterceptor';
import type {
  ClientConfigurationType,
  ClientUserConfigurationType
} from '../types';

export default (clientUserConfiguration?: ClientUserConfigurationType): ClientConfigurationType => {
  let configuration = {
    interceptors: [
      createFieldNameTransformationInterceptor({
        format: 'CAMEL_CASE'
      }),
      createQueryNormalizationInterceptor()
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
