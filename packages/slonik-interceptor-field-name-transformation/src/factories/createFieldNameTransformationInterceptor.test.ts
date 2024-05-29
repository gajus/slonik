import { createFieldNameTransformationInterceptor } from './createFieldNameTransformationInterceptor';
import test from 'ava';
import { type QueryContext } from 'slonik';

const createQueryContext = (): QueryContext => {
  return {
    connectionId: '1',
    log: {
      getContext: () => {
        return {
          connectionId: '1',
          poolId: '1',
        };
      },
    },
    poolId: '1',
    sandbox: {},
  } as unknown as QueryContext;
};

test('transforms field names to camelcase', (t) => {
  const interceptor = createFieldNameTransformationInterceptor({
    format: 'CAMEL_CASE',
  });

  const { transformRow } = interceptor;

  if (!transformRow) {
    throw new Error('Unexpected state.');
  }

  const result = transformRow(
    createQueryContext(),
    {
      sql: 'SELECT 1',
      values: [],
    },
    {
      foo_bar: 1,
    },
    [
      {
        dataTypeId: 1,
        name: 'foo_bar',
      },
    ],
  );

  t.deepEqual(result, {
    fooBar: 1,
  });
});
