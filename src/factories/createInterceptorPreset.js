// @flow

import {
  createFieldNameTransformationInterceptor,
  createQueryNormalizationInterceptor
} from '../interceptors';

export default () => {
  return [
    createQueryNormalizationInterceptor(),
    createFieldNameTransformationInterceptor({
      format: 'CAMEL_CASE'
    })
  ];
};
