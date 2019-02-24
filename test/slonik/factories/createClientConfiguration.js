// @flow

import test from 'ava';
import createClientConfiguration from '../../../src/factories/createClientConfiguration';
import createTypeParserPreset from '../../../src/factories/createTypeParserPreset';

const defaultConfiguration = {
  captureStackTrace: true,
  interceptors: [],
  typeParsers: createTypeParserPreset()
};

test('creates default configuration', (t) => {
  const configuration = createClientConfiguration();

  t.deepEqual(configuration, defaultConfiguration);
});

test('overrides provided properties', (t) => {
  t.deepEqual(
    createClientConfiguration({
      captureStackTrace: false
    }),
    {
      ...defaultConfiguration,
      captureStackTrace: false
    }
  );

  t.deepEqual(
    createClientConfiguration({
      interceptors: [
        // $FlowFixMe
        'foo'
      ]
    }),
    {
      ...defaultConfiguration,
      interceptors: [
        'foo'
      ]
    }
  );

  t.deepEqual(
    createClientConfiguration({
      typeParsers: [
        // $FlowFixMe
        'foo'
      ]
    }),
    {
      ...defaultConfiguration,
      typeParsers: [
        'foo'
      ]
    }
  );
});
