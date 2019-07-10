// @flow

import test from 'ava';
import createClientConfiguration from '../../../src/factories/createClientConfiguration';
import createTypeParserPreset from '../../../src/factories/createTypeParserPreset';

const defaultConfiguration = {
  captureStackTrace: true,
  connectionTimeout: 5000,
  idleTimeout: 5000,
  interceptors: [],
  maximumPoolSize: 10,
  minimumPoolSize: 0,
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

test('disables default type parsers', (t) => {
  t.deepEqual(
    createClientConfiguration({
      typeParsers: []
    }),
    {
      ...defaultConfiguration,
      typeParsers: []
    }
  );
});

test('connectionTimeout=0 sets timeout to 1 millisecond', (t) => {
  const configuration = createClientConfiguration({
    connectionTimeout: 0
  });

  t.is(configuration.connectionTimeout, 1);
});

test('connectionTimeout=DISABLE_TIMEOUT sets timeout to 0 milliseconds (which pg-pool interprets as disabled)', (t) => {
  const configuration = createClientConfiguration({
    connectionTimeout: 0
  });

  t.is(configuration.connectionTimeout, 1);
});

test('idleTimeout=0 sets timeout to 1 millisecond', (t) => {
  const configuration = createClientConfiguration({
    idleTimeout: 0
  });

  t.is(configuration.idleTimeout, 1);
});

test('idleTimeout=DISABLE_TIMEOUT sets timeout to 0 milliseconds (which pg-pool interprets as disabled)', (t) => {
  const configuration = createClientConfiguration({
    idleTimeout: 0
  });

  t.is(configuration.idleTimeout, 1);
});
