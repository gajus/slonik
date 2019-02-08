// @flow

import test from 'ava';
import createFormatFieldNameInterceptor from '../../src/interceptors/createFormatFieldNameInterceptor';

test('changes field names to camelcase', (t) => {
  const interceptor = createFormatFieldNameInterceptor({
    format: 'CAMEL_CASE'
  });

  if (!interceptor.afterQuery) {
    throw new Error('Unexpected state.');
  }

  const result = interceptor.afterQuery(
    {
      sql: 'SELECT 1'
    },
    {
      command: 'SELECT',
      fields: [
        {
          columnID: 1,
          dataTypeID: 1,
          dataTypeModifier: 1,
          dataTypeSize: 1,
          format: '',
          name: 'foo_bar',
          tableID: 1
        }
      ],
      oid: null,
      rowAsArray: false,
      rowCount: 1,
      rows: [
        {
          foo_bar: 1
        }
      ]
    }
  );

  t.deepEqual(result, {
    command: 'SELECT',
    fields: [
      {
        columnID: 1,
        dataTypeID: 1,
        dataTypeModifier: 1,
        dataTypeSize: 1,
        format: '',
        name: 'foo_bar',
        tableID: 1
      }
    ],
    oid: null,
    rowAsArray: false,
    rowCount: 1,
    rows: [
      {
        fooBar: 1
      }
    ]
  });
});
