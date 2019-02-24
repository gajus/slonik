// @flow

import type {
  ClientConfigurationType,
  ClientUserConfigurationType
} from '../types';
import createTypeParserPreset from './createTypeParserPreset';

export default (clientUserConfiguration?: ClientUserConfigurationType): ClientConfigurationType => {
  const configuration = {
    captureStackTrace: true,

    // $FlowFixMe
    interceptors: [],

    // $FlowFixMe
    typeParsers: [],
    ...clientUserConfiguration
  };

  if (!configuration.typeParsers || !configuration.typeParsers.length) {
    configuration.typeParsers = createTypeParserPreset();
  }

  return configuration;
};
