/* eslint-disable unicorn/prevent-abbreviations */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-new */
/* eslint-disable unicorn/consistent-function-scoping */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  expectTypeOf,
} from 'expect-type';
import {
  CheckIntegrityConstraintViolationError,
  DataIntegrityError,
  ForeignKeyIntegrityConstraintViolationError,
  IdentifierNormalizerType,
  IntegrityConstraintViolationError,
  InterceptorType,
  InvalidConfigurationError,
  NotFoundError,
  NotNullIntegrityConstraintViolationError,
  QueryContextType,
  QueryResultRowColumnType,
  SlonikError,
  SqlTaggedTemplateType,
  StatementCancelledError,
  StatementTimeoutError,
  TypeParserType,
  UniqueIntegrityConstraintViolationError, createBigintTypeParser, createPool,
  createSqlTag,
  createTimestampTypeParser,
  createTimestampWithTimeZoneTypeParser,
  createTypeParserPreset,
  sql,
  QueryResultType,
} from '../src';

const VALUE = 'foo';

const connection = createPool('postgres://');

const poolTypes = () => {
  const pool = createPool('postgres://localhost');

  const promise = pool.connect(async (conn) => {
    const result = await conn.query(sql`SELECT 1`);

    expectTypeOf(result).toEqualTypeOf<QueryResultType<Record<string, QueryResultRowColumnType>>>();

    expectTypeOf(result.rows[0]).toEqualTypeOf<Record<string, QueryResultRowColumnType>>();

    conn.query(sql`
        SELECT 1
        FROM foo
        WHERE bar = ${'baz'}
    `);

    // Query methods
    await conn.any(sql`SELECT foo`);
    await conn.anyFirst(sql`SELECT foo`);
    await conn.exists(sql`SELECT foo`);
    await conn.many(sql`SELECT foo`);
    await conn.manyFirst(sql`SELECT foo`);
    await conn.maybeOne(sql`SELECT foo`);
    await conn.maybeOneFirst(sql`SELECT foo`);
    await conn.one(sql`SELECT foo`);
    await conn.oneFirst(sql`SELECT foo`);

    // Disallow raw strings
    // @ts-expect-error
    await conn.query('SELECT foo');

    const transaction1 = await conn.transaction(async (transactionConnection) => {
      await transactionConnection.query(sql`INSERT INTO foo (bar) VALUES ('baz')`);
      await transactionConnection.query(sql`INSERT INTO qux (quux) VALUES ('corge')`);

      return {transactionResult: 'foo'};
    });
    expectTypeOf(transaction1).toEqualTypeOf<{transactionResult: string}>();

    const transaction2 = await conn.transaction(async (t1) => {
      await t1.query(sql`INSERT INTO foo (bar) VALUES ('baz')`);

      return t1.transaction((t2) => {
        return t2.query(sql`INSERT INTO qux (quux) VALUES ('corge')`);
      });
    });
    expectTypeOf(transaction2).toEqualTypeOf<QueryResultType<Record<string, QueryResultRowColumnType>>>();

    const transaction3 = await conn.transaction(async (t1) => {
      await t1.query(sql`INSERT INTO foo (bar) VALUES ('baz')`);

      try {
        await t1.transaction(async (t2) => {
          await t2.query(sql`INSERT INTO qux (quux) VALUES ('corge')`);

          return Promise.reject(new Error('foo'));
        });
      } catch {
        /* empty */
      }
    });
    expectTypeOf(transaction3).toEqualTypeOf<void>();

    return {connectResult: 'foo'};
  });

  expectTypeOf(promise).resolves.toEqualTypeOf<{ connectResult: string }>();

  pool.query(sql`SELECT * FROM table WHERE name = '${VALUE}'`);

  const typedQuery = async () => {
    interface Foo {
        foo: string;
    }
    interface FooBar extends Foo {
        bar: number;
    }
    const getFooQuery = (limit: number) => {
      return sql<Foo>`select foo from foobartable limit ${limit}`;
    };

    const getFooBarQuery = (limit: number) => {
      return sql<FooBar>`select foo, bar from foobartable limit ${limit}`;
    };

    expectTypeOf(await pool.query(getFooBarQuery(10))).toEqualTypeOf<QueryResultType<FooBar>>();

    expectTypeOf(await pool.exists(getFooQuery(10))).toBeBoolean();

    expectTypeOf(await pool.oneFirst(getFooQuery(10))).toBeString();

    expectTypeOf(await pool.one(getFooBarQuery(10))).toEqualTypeOf<FooBar>();

    expectTypeOf(await pool.maybeOneFirst(getFooQuery(10))).toEqualTypeOf<string | null>();

    expectTypeOf(await pool.maybeOne(getFooBarQuery(10))).toEqualTypeOf<FooBar | null>();

    expectTypeOf(await pool.any(getFooBarQuery(10))).toEqualTypeOf<readonly FooBar[]>();

    expectTypeOf(await pool.anyFirst(getFooQuery(10))).toEqualTypeOf<string[]>();

    expectTypeOf(await pool.anyFirst(getFooBarQuery(10))).toEqualTypeOf<Array<string | number>>();
  };

  createPool('postgres://localhost', {
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
          expectTypeOf(row.foo).toEqualTypeOf<QueryResultRowColumnType>();

          return row;
        },
      },
    ],
  });
};

const interceptorTypes = () => {
  createPool('postgres://', {
    interceptors: [],
  });

  const interceptors: InterceptorType[] = [
    {
      afterQueryExecution: (queryContext) => {
        expectTypeOf(queryContext).toEqualTypeOf<QueryContextType>();

        expectTypeOf(queryContext.sandbox.foo).toBeUnknown();

        // @ts-expect-error
        const foo = queryContext.sandbox + 1;

        return null;
      },
    },
  ];

  const conn = createPool('postgres://', {
    interceptors,
  });

  conn.any(sql`
    SELECT
        id,
        full_name
    FROM person
  `);
};

//
// TYPE PARSER
// ----------------------------------------------------------------------
const typeParserTypes = () => {
  const typeParser: TypeParserType<number> = {
    name: 'int8',
    parse: (value) => {
      expectTypeOf(value).toBeString();

      return Number.parseInt(value, 10);
    },
  };

  createPool('postgres://', {
    typeParsers: [typeParser],
  });

  createPool('postgres://', {
    typeParsers: [...createTypeParserPreset()],
  });

  createBigintTypeParser();
  createTimestampTypeParser();
  createTimestampWithTimeZoneTypeParser();
};

const recipes = async () => {
  await connection.query(sql`
      INSERT INTO (foo, bar, baz)
      SELECT *
      FROM ${sql.unnest(
    [
      [1, 2, 3],
      [4, 5, 6],
    ],
    ['int4', 'int4', 'int4'],
  )}
  `);
};

const dynamicWhere = async () => {
  const uniquePairs = [
    ['a', 1],
    ['b', 2],
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

  const values = [];

  for (const pairValues of uniquePairs) {
    values.push(...pairValues);
  }
};

const sqlTypes = async () => {
  // ExpectType SqlSqlTokenType
  const query0 = sql`SELECT ${'foo'} FROM bar`;

  // ExpectType SqlSqlTokenType
  const query1 = sql`SELECT ${'baz'} FROM (${query0})`;

  await connection.query(sql`
  SELECT ${sql.identifier(['foo', 'a'])}
  FROM (
    VALUES
    (
      ${sql.join([sql.join(['a1', 'b1', 'c1'], sql`, `), sql.join(['a2', 'b2', 'c2'], sql`, `)], sql`), (`)}
    )
  ) foo(a, b, c)
  WHERE foo.b IN (${sql.join(['c1', 'a2'], sql`, `)})
`);

  await connection.query(sql`
    SELECT (${sql.json([1, 2, {other: 'test',
    test: 12}])})
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
      object: {is: {and: new Date('123').toISOString(),
        other: 12,
        this: 'test'}},
    },
  })})
`);

  // @ts-expect-error
  sql`SELECT ${sql.json(undefined)}`;

  await connection.query(sql`
    SELECT bar, baz
    FROM ${sql.unnest(
    [
      [1, 'foo'],
      [2, 'bar'],
    ],
    ['int4', 'text'],
  )} AS foo(bar, baz)
`);

  sql`
    SELECT 1
    FROM ${sql.identifier(['bar', 'baz'])}
`;
};

const createSqlTagTypes = () => {
  const sqlTag: SqlTaggedTemplateType = createSqlTag();

  sqlTag`
    SELECT 1;
  `;

  const normalizeIdentifier: IdentifierNormalizerType = (input: string) => {
    return input.split('').reverse().join('');
  };
};

const errorTypes = () => {
  new SlonikError();
  new NotFoundError();
  new DataIntegrityError();
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
    await connection.query(sql`
      INSERT INTO (foo, bar, baz)
      SELECT *
      FROM ${sql.unnest(
    [
      [1, 2, 3],
      [4, 5, 6],
    ],
    ['int4', 'int4', 'int4'],
  )}
    `);
  };

  const sample2 = async () => {
    await connection.query(sql`
      SELECT (${sql.array([1, 2, 3], 'int4')})
    `);

    await connection.query(sql`
      SELECT (${sql.array([1, 2, 3], sql`int[]`)})
    `);
  };

  const sample3 = async () => {
    sql`SELECT id FROM foo WHERE id = ANY(${sql.array([1, 2, 3], 'int4')})`;
    sql`SELECT id FROM foo WHERE id != ALL(${sql.array([1, 2, 3], 'int4')})`;
  };

  const sample4 = async () => {
    await connection.query(sql`
      SELECT bar, baz
      FROM ${sql.unnest(
    [
      [1, 'foo'],
      [2, 'bar'],
    ],
    ['int4', 'text'],
  )} AS foo(bar, baz)
    `);
  };

  const sample5 = async () => {
    sql`
      SELECT 1
      FROM ${sql.identifier(['bar', 'baz'])}
    `;
  };

  // end samples from readme
};
