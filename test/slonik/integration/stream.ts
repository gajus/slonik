import { createPool, sql, StatementTimeoutError } from '../../../src';
import { createTestRunner } from '../../helpers/createIntegrationTests';
import { Pool as PgPool } from 'pg';
import * as sinon from 'sinon';
import { z } from 'zod';

const { test } = createTestRunner(PgPool, 'pg');

test('reading stream after a delay', async (t) => {
  const pool = await createPool(t.context.dsn, {
    statementTimeout: 1_000,
  });

  const onData = sinon.spy();

  await t.notThrowsAsync(
    pool.stream(
      sql.unsafe`
      SELECT *
      FROM GENERATE_SERIES(1, 1000)
    `,
      (stream) => {
        setTimeout(() => {
          stream.on('data', onData);
        }, 500);
      },
    ),
  );

  t.true(onData.called);

  await pool.end();
});

test('untapped stream produces statement timeout', async (t) => {
  const pool = await createPool(t.context.dsn, {
    statementTimeout: 100,
  });

  const onData = sinon.spy();

  const error = await t.throwsAsync(
    pool.stream(
      sql.unsafe`
      SELECT *
      FROM GENERATE_SERIES(1, 1000)
    `,
      (stream) => {
        setTimeout(() => {
          stream.on('data', onData);
        }, 500);
      },
    ),
  );

  t.true(error instanceof StatementTimeoutError);

  t.true(onData.callCount < 1_000);

  await pool.end();
});

test('stream pool connection can be re-used after an error', async (t) => {
  const pool = await createPool(t.context.dsn, {
    maximumPoolSize: 1,
    statementTimeout: 100,
  });

  const onData = sinon.spy();

  const error = await t.throwsAsync(
    pool.stream(
      sql.unsafe`
      SELECT *
      FROM GENERATE_SERIES(1, 1000)
    `,
      (stream) => {
        setTimeout(() => {
          stream.on('data', onData);
        }, 500);
      },
    ),
  );

  t.true(error instanceof StatementTimeoutError);

  t.true(onData.callCount < 1_000);

  t.is(await pool.oneFirst(sql.unsafe`SELECT 1`), 1);

  await pool.end();
});

test('streams rows', async (t) => {
  const pool = await createPool(t.context.dsn);

  await pool.query(sql.unsafe`
    INSERT INTO person (name)
    VALUES ('foo'), ('bar'), ('baz')
  `);

  const messages: Array<Record<string, unknown>> = [];

  await pool.stream(
    sql.type(
      z.object({
        name: z.string(),
      }),
    )`
      SELECT name
      FROM person
    `,
    (stream) => {
      stream.on('data', (datum) => {
        messages.push(datum);
      });
    },
  );

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

  await pool.query(sql.unsafe`
    INSERT INTO person (name) VALUES ('foo'), ('bar'), ('baz')
  `);

  const messages: Array<Record<string, unknown>> = [];

  await pool.stream(
    sql.unsafe`
    SELECT name
    FROM person
  `,
    (stream) => {
      stream.on('data', (datum) => {
        messages.push(datum);
      });
    },
    {
      batchSize: 1,
    },
  );

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
          return value === null
            ? value
            : new Date(value + ' 00:00').getFullYear();
        },
      },
    ],
  });

  await pool.query(sql.unsafe`
    INSERT INTO person
      (name, birth_date)
    VALUES
      ('foo', '1990-01-01'),
      ('bar', '1991-01-01'),
      ('baz', '1992-01-01')
  `);

  const messages: Array<Record<string, unknown>> = [];

  await pool.stream(
    sql.unsafe`
    SELECT birth_date
    FROM person
    ORDER BY birth_date ASC
  `,
    (stream) => {
      stream.on('data', (datum) => {
        messages.push(datum);
      });
    },
  );

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

  await pool.query(sql.unsafe`
    INSERT INTO person (name)
    VALUES ('foo'), ('bar'), ('baz')
  `);

  const messages: Array<Record<string, unknown>> = [];

  await pool.transaction(async (transaction) => {
    await transaction.stream(
      sql.unsafe`
      SELECT name
      FROM person
    `,
      (stream) => {
        stream.on('data', (datum) => {
          messages.push(datum);
        });
      },
    );
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

test('frees connection after destroying a stream', async (t) => {
  const pool = await createPool(t.context.dsn);

  await t.throwsAsync(
    pool.stream(
      sql.unsafe`
    SELECT * FROM GENERATE_SERIES(1, 100)
  `,
      (stream) => {
        stream.destroy();
      },
    ),
  );

  t.deepEqual(
    await pool.anyFirst(sql.unsafe`
    SELECT TRUE
  `),
    [true],
  );

  await pool.end();
});

test('frees connection after destroying a stream with an error', async (t) => {
  const pool = await createPool(t.context.dsn);

  const error = await t.throwsAsync(
    pool.stream(
      sql.unsafe`
    SELECT * FROM GENERATE_SERIES(1, 100)
  `,
      (stream) => {
        stream.destroy(new Error('Foo'));
      },
    ),
  );

  t.is(error?.message, 'Foo');

  t.deepEqual(
    await pool.anyFirst(sql.unsafe`
    SELECT TRUE
  `),
    [true],
  );

  await pool.end();
});

test('stream throws error on syntax errors', async (t) => {
  const pool = await createPool(t.context.dsn);

  const error = await t.throwsAsync(
    pool.stream(
      sql.unsafe`
        INVALID SYNTAX
      `,
      (stream) => {
        stream.on('data', () => {});
      },
    ),
  );

  t.true(error instanceof Error);

  t.deepEqual(error?.message, 'syntax error at or near "INVALID"');

  await pool.end();
});
