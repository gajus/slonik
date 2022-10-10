/* eslint-disable no-new */

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  expectTypeOf,
} from 'expect-type';
import {
  CheckIntegrityConstraintViolationError,
  DataIntegrityError,
  ForeignKeyIntegrityConstraintViolationError,
  IntegrityConstraintViolationError,
  InvalidConfigurationError,
  NotFoundError,
  NotNullIntegrityConstraintViolationError,
  SlonikError,
  StatementCancelledError,
  StatementTimeoutError,
  UniqueIntegrityConstraintViolationError,
  createBigintTypeParser,
  createPool,
  createSqlTag,
  createTimestampTypeParser,
  createTimestampWithTimeZoneTypeParser,
  createTypeParserPreset,
  sql,

  type ClientConfigurationInput,
  type ClientConfiguration,
  type CommonQueryMethods,
  type IdentifierNormalizer,
  type Interceptor,
  type QueryContext,
  type QueryResultRowColumn,
  type QueryResult,
  type SqlTaggedTemplate,
  type TypeParser,
} from '../src';

const poolTypes = async () => {
  const pool = await createPool('postgres://localhost');

  expectTypeOf<ClientConfiguration>().toMatchTypeOf<ClientConfigurationInput>();
  expectTypeOf<Partial<ClientConfiguration>>().toEqualTypeOf<ClientConfigurationInput>();

  expectTypeOf(pool).toHaveProperty('configuration').toEqualTypeOf<ClientConfiguration>();

  const promise = pool.connect(async (poolConnection) => {
    const result = await poolConnection.query(sql`SELECT 1`);

    expectTypeOf(result).toEqualTypeOf<QueryResult<Record<string, QueryResultRowColumn>>>();

    expectTypeOf(result.rows[0]).toEqualTypeOf<Record<string, QueryResultRowColumn>>();

    void poolConnection.query(sql`
      SELECT 1
      FROM foo
      WHERE bar = ${'baz'}
    `);

    // Query methods
    await poolConnection.any(sql`SELECT foo`);
    await poolConnection.anyFirst(sql`SELECT foo`);
    await poolConnection.exists(sql`SELECT foo`);
    await poolConnection.many(sql`SELECT foo`);
    await poolConnection.manyFirst(sql`SELECT foo`);
    await poolConnection.maybeOne(sql`SELECT foo`);
    await poolConnection.maybeOneFirst(sql`SELECT foo`);
    await poolConnection.one(sql`SELECT foo`);
    await poolConnection.oneFirst(sql`SELECT foo`);

    // Disallow raw strings
    // @ts-expect-error
    await poolConnection.query('SELECT foo');

    const transaction1 = await poolConnection.transaction(async (transactionConnection) => {
      await transactionConnection.query(sql`INSERT INTO foo (bar) VALUES ('baz')`);
      await transactionConnection.query(sql`INSERT INTO qux (quux) VALUES ('corge')`);

      return {
        transactionResult: 'foo',
      };
    });
    expectTypeOf(transaction1).toEqualTypeOf<{transactionResult: string, }>();

    const transaction2 = await poolConnection.transaction(async (t1) => {
      await t1.query(sql`INSERT INTO foo (bar) VALUES ('baz')`);

      return await t1.transaction(async (t2) => {
        return await t2.query(sql`INSERT INTO qux (quux) VALUES ('corge')`);
      });
    });
    expectTypeOf(transaction2).toEqualTypeOf<QueryResult<Record<string, QueryResultRowColumn>>>();

    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    const transaction3 = await poolConnection.transaction(async (t1): Promise<void> => {
      await t1.query(sql`INSERT INTO foo (bar) VALUES ('baz')`);

      try {
        await t1.transaction(async (t2) => {
          await t2.query(sql`INSERT INTO qux (quux) VALUES ('corge')`);

          return await Promise.reject(new Error('foo'));
        });
      } catch {
        /* empty */
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    expectTypeOf(transaction3).toEqualTypeOf<void>();

    return {
      connectResult: 'foo',
    };
  });

  expectTypeOf(promise).resolves.toEqualTypeOf<{ connectResult: string, }>();

  const VALUE = 'foo';

  void pool.query(sql`SELECT * FROM table WHERE name = '${VALUE}'`);

  const typedQuery = async () => {
    type Foo = {
      foo: string,
    };
    type FooBar = Foo & {
      bar: number,
    };
    const getFooQuery = (limit: number) => {
      return sql<Foo>`select foo from foobartable limit ${limit}`;
    };

    const getFooBarQuery = (limit: number) => {
      return sql<FooBar>`select foo, bar from foobartable limit ${limit}`;
    };

    expectTypeOf(await pool.query(getFooBarQuery(10))).toEqualTypeOf<QueryResult<FooBar>>();

    expectTypeOf(await pool.exists(getFooQuery(10))).toBeBoolean();

    expectTypeOf(await pool.oneFirst(getFooQuery(10))).toBeString();

    expectTypeOf(await pool.one(getFooBarQuery(10))).toEqualTypeOf<FooBar>();

    expectTypeOf(await pool.maybeOneFirst(getFooQuery(10))).toEqualTypeOf<string | null>();

    expectTypeOf(await pool.maybeOne(getFooBarQuery(10))).toEqualTypeOf<FooBar | null>();

    expectTypeOf(await pool.any(getFooBarQuery(10))).toEqualTypeOf<readonly FooBar[]>();

    expectTypeOf(await pool.anyFirst(getFooQuery(10))).toEqualTypeOf<readonly string[]>();

    expectTypeOf(await pool.anyFirst(getFooBarQuery(10))).toEqualTypeOf<ReadonlyArray<number | string>>();
  };

  await createPool('postgres://localhost', {
    interceptors: [
      {
        afterPoolConnection: async (context, conn) => {
          await conn.query(sql`LOAD 'auto_explain'`);
          await conn.query(sql`SET auto_explain.log_analyze=true`);
          await conn.query(sql`SET auto_explain.log_format=json`);
          await conn.query(sql`SET auto_explain.log_min_duration=0`);
          await conn.query(sql`SET auto_explain.log_timing=true`);
          await conn.query(sql`SET client_min_messages=log`);

          return null;
        },
        transformRow: (context, query, row, fields) => {
          expectTypeOf(context.queryId).toBeString();
          expectTypeOf(query.sql).toBeString();
          expectTypeOf(fields[0].dataTypeId).toBeNumber();
          expectTypeOf(row.foo).toEqualTypeOf<QueryResultRowColumn>();

          return row;
        },
      },
    ],
  });
};

const interceptorTypes = async () => {
  await createPool('postgres://', {
    interceptors: [],
  });

  const interceptors: Interceptor[] = [
    {
      afterQueryExecution: (queryContext) => {
        expectTypeOf(queryContext).toEqualTypeOf<QueryContext>();

        expectTypeOf(queryContext.sandbox.foo).toBeUnknown();

        // @ts-expect-error
        const foo = queryContext.sandbox + 1;

        return null;
      },
    },
  ];

  const conn = await createPool('postgres://', {
    interceptors,
  });

  void conn.any(sql`
    SELECT
        id,
        full_name
    FROM person
  `);
};

//
// TYPE PARSER
// ----------------------------------------------------------------------
const typeParserTypes = async () => {
  const typeParser: TypeParser<number> = {
    name: 'int8',
    parse: (value) => {
      expectTypeOf(value).toBeString();

      return Number.parseInt(value, 10);
    },
  };

  await createPool('postgres://', {
    typeParsers: [
      typeParser,
    ],
  });

  await createPool('postgres://', {
    typeParsers: [
      ...createTypeParserPreset(),
    ],
  });

  createBigintTypeParser();
  createTimestampTypeParser();
  createTimestampWithTimeZoneTypeParser();
};

const recipes = async () => {
  const connection = await createPool('postgres://');

  await connection.query(sql`
    INSERT INTO (foo, bar, baz)
    SELECT *
    FROM ${sql.unnest(
    [
      [
        1,
        2,
        3,
      ],
      [
        4,
        5,
        6,
      ],
    ],
    [
      'int4',
      'int4',
      'int4',
    ],
  )}
  `);
};

const dynamicWhere = async () => {
  const uniquePairs = [
    [
      'a',
      1,
    ],
    [
      'b',
      2,
    ],
  ];

  let placeholderIndex = 1;

  const whereConditionSql = uniquePairs
    .map((needleColumns) => {
      return needleColumns
        .map((column) => {
          return `${column} = $${placeholderIndex++}`;
        })
        .join(' AND ');
    })
    .join(' OR ');

  const values: Array<number | string> = [];

  for (const pairValues of uniquePairs) {
    values.push(...pairValues);
  }
};

const sqlTypes = async () => {
  const connection = await createPool('postgres://');

  // ExpectType SqlSqlToken
  const query0 = sql`SELECT ${'foo'} FROM bar`;

  // ExpectType SqlSqlToken
  const query1 = sql`SELECT ${'baz'} FROM (${query0})`;

  await connection.query(sql`
    SELECT ${sql.identifier([
    'foo',
    'a',
  ])}
    FROM (
      VALUES
      (
        ${sql.join([
    sql.join([
      'a1',
      'b1',
      'c1',
    ], sql`, `),
    sql.join([
      'a2',
      'b2',
      'c2',
    ], sql`, `),
  ], sql`), (`)}
      )
    ) foo(a, b, c)
    WHERE foo.b IN (${sql.join([
    'c1',
    'a2',
  ], sql`, `)})
  `);

  await connection.query(sql`
    SELECT (${sql.json([
    1,
    2,
    {
      other: 'test',
      test: 12,
    },
  ])})
  `);

  await connection.query(sql`
    SELECT (${sql.json('test')})
  `);

  await connection.query(sql`
    SELECT (${sql.json(null)})
  `);

  await connection.query(sql`
    SELECT (${sql.json(123)})
  `);

  await connection.query(sql`
    SELECT (${sql.json({
    nested: {
      object: {
        is: {
          and: new Date('123').toISOString(),
          other: 12,
          this: 'test',
        },
      },
    },
  })})
  `);

  // @ts-expect-error
  sql`SELECT ${sql.json(undefined)}`;

  await connection.query(sql`
    SELECT bar, baz
    FROM ${sql.unnest(
    [
      [
        1,
        'foo',
      ],
      [
        2,
        'bar',
      ],
    ],
    [
      'int4',
      'text',
    ],
  )} AS foo(bar, baz)
  `);

  sql`
    SELECT 1
    FROM ${sql.identifier([
    'bar',
    'baz',
  ])}
  `;
};

const createSqlTagTypes = () => {
  const sqlTag = createSqlTag();

  sqlTag`
    SELECT 1;
  `;

  const normalizeIdentifier: IdentifierNormalizer = (input: string) => {
    return input.split('').reverse().join('');
  };
};

const errorTypes = () => {
  new SlonikError();
  new NotFoundError(sql`SELECT 1`);
  new DataIntegrityError(sql`SELECT 1`);
  new InvalidConfigurationError();
  new StatementCancelledError(new Error('Foo'));
  new StatementTimeoutError(new Error('Foo'));
  new IntegrityConstraintViolationError(new Error('Foo'), 'some-constraint');
  new NotNullIntegrityConstraintViolationError(new Error('Foo'), 'some-constraint');
  new ForeignKeyIntegrityConstraintViolationError(new Error('Foo'), 'some-constraint');
  new UniqueIntegrityConstraintViolationError(new Error('Foo'), 'some-constraint');
  new CheckIntegrityConstraintViolationError(new Error('Foo'), 'some-constraint');
};

const samplesFromDocs = async () => {
  // some samples generated by parsing the readme from slonik's github page
  // start samples from readme
  const sample1 = async () => {
    const connection = await createPool('postgres://');

    await connection.query(sql`
      INSERT INTO (foo, bar, baz)
      SELECT *
      FROM ${sql.unnest(
    [
      [
        1,
        2,
        3,
      ],
      [
        4,
        5,
        6,
      ],
    ],
    [
      'int4',
      'int4',
      'int4',
    ],
  )}
    `);
  };

  const sample2 = async () => {
    const connection = await createPool('postgres://');

    await connection.query(sql`
      SELECT (${sql.array([
    1,
    2,
    3,
  ], 'int4')})
    `);

    await connection.query(sql`
      SELECT (${sql.array([
    1,
    2,
    3,
  ], sql`int[]`)})
    `);
  };

  const sample3 = async () => {
    sql`SELECT id FROM foo WHERE id = ANY(${sql.array([
      1,
      2,
      3,
    ], 'int4')})`;
    sql`SELECT id FROM foo WHERE id != ALL(${sql.array([
      1,
      2,
      3,
    ], 'int4')})`;
  };

  const sample4 = async () => {
    const connection = await createPool('postgres://');

    await connection.query(sql`
      SELECT bar, baz
      FROM ${sql.unnest(
    [
      [
        1,
        'foo',
      ],
      [
        2,
        'bar',
      ],
    ],
    [
      'int4',
      'text',
    ],
  )} AS foo(bar, baz)
    `);
  };

  const sample5 = async () => {
    sql`
      SELECT 1
      FROM ${sql.identifier([
    'bar',
    'baz',
  ])}
    `;
  };

  // end samples from readme
};

const exportedTypes = (): void => {
  // make sure CommonQueryMethods is exported by package
  expectTypeOf<CommonQueryMethods>().toHaveProperty('any').toBeCallableWith(sql`select 1`);
};
