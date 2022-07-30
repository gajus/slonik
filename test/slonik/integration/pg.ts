import {
  Pool as PgPool,
} from 'pg';
import {
  createPool,
  sql,
} from '../../../src';
import {
  createTestRunner,
  createIntegrationTests,
} from '../../helpers/createIntegrationTests';

const {
  test,
} = createTestRunner(PgPool, 'pg');

createIntegrationTests(
  test,
  PgPool,
);

test('returns expected query result object (NOTICE)', async (t) => {
  const pool = await createPool(t.context.dsn, {
    PgPool,
  });

  await pool.query(sql`
    CREATE OR REPLACE FUNCTION test_notice
      (
        v_test INTEGER
      ) RETURNS BOOLEAN
      LANGUAGE plpgsql
    AS
    $$
    BEGIN

      RAISE NOTICE '1. TEST NOTICE [%]',v_test;
      RAISE NOTICE '2. TEST NOTICE [%]',v_test;
      RAISE NOTICE '3. TEST NOTICE [%]',v_test;
      RAISE LOG '4. TEST LOG [%]',v_test;
      RAISE NOTICE '5. TEST NOTICE [%]',v_test;

      RETURN TRUE;
    END;
    $$;
  `);

  const result = await pool.query(sql`SELECT * FROM test_notice(${10});`);

  t.is(result.notices.length, 4);

  await pool.end();
});

test('streams rows', async (t) => {
  const pool = await createPool(t.context.dsn);

  await pool.query(sql`
    INSERT INTO person (name) VALUES ('foo'), ('bar'), ('baz')
  `);

  const messages: Array<Record<string, unknown>> = [];

  await pool.stream(sql`
    SELECT name
    FROM person
  `, (stream) => {
    stream.on('data', (datum) => {
      messages.push(datum);
    });
  });

  t.deepEqual(messages, [
    {
      fields: [
        {
          dataTypeId: 25,
          name: 'name',
        },
      ],
      row: {
        name: 'foo',
      },
    },
    {
      fields: [
        {
          dataTypeId: 25,
          name: 'name',
        },
      ],
      row: {
        name: 'bar',
      },
    },
    {
      fields: [
        {
          dataTypeId: 25,
          name: 'name',
        },
      ],
      row: {
        name: 'baz',
      },
    },
  ]);

  await pool.end();
});

test('streams rows with different batchSize', async (t) => {
  const pool = await createPool(t.context.dsn);

  await pool.query(sql`
    INSERT INTO person (name) VALUES ('foo'), ('bar'), ('baz')
  `);

  const messages: Array<Record<string, unknown>> = [];

  await pool.stream(sql`
    SELECT name
    FROM person
  `, (stream) => {
    stream.on('data', (datum) => {
      messages.push(datum);
    });
  }, {
    batchSize: 1,
  });

  t.deepEqual(messages, [
    {
      fields: [
        {
          dataTypeId: 25,
          name: 'name',
        },
      ],
      row: {
        name: 'foo',
      },
    },
    {
      fields: [
        {
          dataTypeId: 25,
          name: 'name',
        },
      ],
      row: {
        name: 'bar',
      },
    },
    {
      fields: [
        {
          dataTypeId: 25,
          name: 'name',
        },
      ],
      row: {
        name: 'baz',
      },
    },
  ]);

  await pool.end();
});

test('applies type parsers to streamed rows', async (t) => {
  const pool = await createPool(t.context.dsn, {
    typeParsers: [
      {
        name: 'date',
        parse: (value) => {
          return value === null ? value : new Date(value + ' 00:00').getFullYear();
        },
      },
    ],
  });

  await pool.query(sql`
    INSERT INTO person
      (name, birth_date)
    VALUES
      ('foo', '1990-01-01'),
      ('bar', '1991-01-01'),
      ('baz', '1992-01-01')
  `);

  const messages: Array<Record<string, unknown>> = [];

  await pool.stream(sql`
    SELECT birth_date
    FROM person
    ORDER BY birth_date ASC
  `, (stream) => {
    stream.on('data', (datum) => {
      messages.push(datum);
    });
  });

  t.deepEqual(messages, [
    {
      fields: [
        {
          dataTypeId: 1_082,
          name: 'birth_date',
        },
      ],
      row: {
        birth_date: 1_990,
      },
    },
    {
      fields: [
        {
          dataTypeId: 1_082,
          name: 'birth_date',
        },
      ],
      row: {
        birth_date: 1_991,
      },
    },
    {
      fields: [
        {
          dataTypeId: 1_082,
          name: 'birth_date',
        },
      ],
      row: {
        birth_date: 1_992,
      },
    },
  ]);

  await pool.end();
});

test('streams over a transaction', async (t) => {
  const pool = await createPool(t.context.dsn);

  await pool.query(sql`
    INSERT INTO person (name) VALUES ('foo'), ('bar'), ('baz')
  `);

  const messages: Array<Record<string, unknown>> = [];

  await pool.transaction(async (transaction) => {
    await transaction.stream(sql`
      SELECT name
      FROM person
    `, (stream) => {
      stream.on('data', (datum) => {
        messages.push(datum);
      });
    });
  });

  t.deepEqual(messages, [
    {
      fields: [
        {
          dataTypeId: 25,
          name: 'name',
        },
      ],
      row: {
        name: 'foo',
      },
    },
    {
      fields: [
        {
          dataTypeId: 25,
          name: 'name',
        },
      ],
      row: {
        name: 'bar',
      },
    },
    {
      fields: [
        {
          dataTypeId: 25,
          name: 'name',
        },
      ],
      row: {
        name: 'baz',
      },
    },
  ]);

  await pool.end();
});

test('copies from binary stream', async (t) => {
  const pool = await createPool(t.context.dsn);

  await pool.copyFromBinary(
    sql`
      COPY person
      (
        name
      )
      FROM STDIN BINARY
    `,
    [
      [
        'foo',
      ],
      [
        'bar',
      ],
      [
        'baz',
      ],
    ],
    [
      'text',
    ],
  );

  t.deepEqual(await pool.anyFirst(sql`
    SELECT name
    FROM person
  `), [
    'foo',
    'bar',
    'baz',
  ]);

  await pool.end();
});

test('frees connection after destroying a stream', async (t) => {
  const pool = await createPool(t.context.dsn);

  await pool.stream(sql`
    SELECT * FROM GENERATE_SERIES(1, 100)
  `, (stream) => {
    stream.destroy();
  });

  t.deepEqual(await pool.anyFirst(sql`
    SELECT TRUE
  `), [
    true,
  ]);

  await pool.end();
});

test('does not crash after destroying a stream with an error', async (t) => {
  const pool = await createPool(t.context.dsn);

  await pool.stream(sql`
    SELECT * FROM GENERATE_SERIES(1, 100)
  `, (stream) => {
    stream.destroy(new Error('Foo'));
  });

  t.deepEqual(await pool.anyFirst(sql`
    SELECT TRUE
  `), [
    true,
  ]);

  await pool.end();
});
