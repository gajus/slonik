import { createConnectionLoaderClass } from './createConnectionLoaderClass';
import { type QueryResultRow } from '@slonik/types';
import {
  type FieldNode,
  type GraphQLResolveInfo,
  type OperationDefinitionNode,
  parse,
} from 'graphql';
import {
  createPool,
  type DatabasePool,
  type Interceptor,
  SchemaValidationError,
  sql,
} from 'slonik';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const POSTGRES_DSN =
  // eslint-disable-next-line n/no-process-env
  process.env.POSTGRES_DSN ?? 'postgres://postgres@localhost:5432';

const getInfo = (
  fields: string[],
): Pick<GraphQLResolveInfo, 'fieldNodes' | 'fragments'> => {
  const document = parse(`{ connection { ${fields.join(' ')} } }`);

  return {
    fieldNodes: [
      (document.definitions[0] as OperationDefinitionNode).selectionSet
        .selections[0] as FieldNode,
    ],
    fragments: {},
  };
};

const PersonConnectionLoader = createConnectionLoaderClass({
  query: sql.type(
    z.object({
      id: z.number(),
      name: z.string(),
      uid: z.string(),
    }),
  )`
    SELECT
      id,
      uid,
      name
    FROM person
  `,
});

const getNodeIds = (edges) => edges.map(({ node }) => node.id);

describe('createConnectionLoaderClass', () => {
  let pool: DatabasePool;

  beforeAll(async () => {
    pool = await createPool(POSTGRES_DSN);

    await pool.query(sql.unsafe`
      CREATE TABLE IF NOT EXISTS person (
        id integer NOT NULL PRIMARY KEY,
        uid text NOT NULL,
        name text NOT NULL
      );
    `);

    await pool.query(sql.unsafe`
      INSERT INTO person
        (id, uid, name)
      VALUES
        (1, 'a', 'aaa'),
        (2, 'b', 'aaa'),
        (3, 'c', 'bbb'),
        (4, 'd', 'bbb'),
        (5, 'e', 'ccc'),
        (6, 'f', 'ccc'),
        (7, 'g', 'ddd'),
        (8, 'h', 'ddd'),
        (9, 'i', 'eee'),
        (10, 'j', 'eee');
    `);
  });

  afterAll(async () => {
    if (pool) {
      await pool.query(sql.unsafe`
        DROP TABLE IF EXISTS person;
      `);

      await pool.end();
    }
  });

  it('loads all records with no additional options', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const result = await loader.load({});

    expect(result).toMatchObject({
      pageInfo: {
        endCursor: result.edges[9].cursor,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: result.edges[0].cursor,
      },
    });
    expect(result.edges).toHaveLength(10);
  });

  it('loads records in ascending order', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const result = await loader.load({
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(result.edges[0].node.id).toEqual(1);
    expect(result.edges[9].node.id).toEqual(10);
  });

  it('loads records in descending order', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const result = await loader.load({
      orderBy: ({ uid }) => [[uid, 'DESC']],
    });

    expect(result.edges[0].node.id).toEqual(10);
    expect(result.edges[9].node.id).toEqual(1);
  });

  it('loads records with multiple order by expressions', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const result = await loader.load({
      orderBy: ({ uid, name }) => [
        [name, 'ASC'],
        [uid, 'DESC'],
      ],
    });

    expect(getNodeIds(result.edges)).toEqual([2, 1, 4, 3, 6, 5, 8, 7, 10, 9]);
  });

  it('loads records with complex order by expression', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const result = await loader.load({
      orderBy: ({ uid }) => [[sql.fragment`${uid}`, 'ASC']],
    });

    expect(getNodeIds(result.edges)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('loads records with where expression', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const result = await loader.load({
      where: ({ name }) => sql.fragment`${name} = 'eee'`,
    });

    expect(getNodeIds(result.edges)).toEqual([9, 10]);
  });

  it('loads records with limit', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const result = await loader.load({
      limit: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(getNodeIds(result.edges)).toEqual([1, 2, 3, 4]);
  });

  it('loads records with limit and offset', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const result = await loader.load({
      limit: 4,
      offset: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(getNodeIds(result.edges)).toEqual([5, 6, 7, 8]);
  });

  it('paginates through the records forwards', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const firstResult = await loader.load({
      limit: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(getNodeIds(firstResult.edges)).toEqual([1, 2, 3, 4]);
    expect(firstResult.pageInfo).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: false,
    });

    const secondResult = await loader.load({
      cursor: firstResult.pageInfo.endCursor,
      limit: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(getNodeIds(secondResult.edges)).toEqual([5, 6, 7, 8]);
    expect(secondResult.pageInfo).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: true,
    });

    const thirdResult = await loader.load({
      cursor: secondResult.pageInfo.endCursor,
      limit: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(getNodeIds(thirdResult.edges)).toEqual([9, 10]);
    expect(thirdResult.pageInfo).toMatchObject({
      hasNextPage: false,
      hasPreviousPage: true,
    });

    const fourthResult = await loader.load({
      cursor: thirdResult.pageInfo.endCursor,
      limit: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(getNodeIds(fourthResult.edges)).toEqual([]);
    expect(fourthResult.pageInfo).toMatchObject({
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it('paginates through the records backwards', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const firstResult = await loader.load({
      limit: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
      reverse: true,
    });

    expect(getNodeIds(firstResult.edges)).toEqual([7, 8, 9, 10]);
    expect(firstResult.pageInfo).toMatchObject({
      hasNextPage: false,
      hasPreviousPage: true,
    });

    const secondResult = await loader.load({
      cursor: firstResult.pageInfo.startCursor,
      limit: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
      reverse: true,
    });

    expect(getNodeIds(secondResult.edges)).toEqual([3, 4, 5, 6]);
    expect(secondResult.pageInfo).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: true,
    });

    const thirdResult = await loader.load({
      cursor: secondResult.pageInfo.startCursor,
      limit: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
      reverse: true,
    });

    expect(getNodeIds(thirdResult.edges)).toEqual([1, 2]);
    expect(thirdResult.pageInfo).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: false,
    });

    const fourthResult = await loader.load({
      cursor: thirdResult.pageInfo.startCursor,
      limit: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
      reverse: true,
    });

    expect(getNodeIds(fourthResult.edges)).toEqual([]);
    expect(fourthResult.pageInfo).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it('batches loaded records', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const poolAnySpy = vi.spyOn(pool, 'any');

    poolAnySpy.mockClear();

    const results = await Promise.all([
      loader.load({
        orderBy: ({ uid }) => [[uid, 'ASC']],
      }),
      loader.load({
        orderBy: ({ uid }) => [[uid, 'DESC']],
      }),
    ]);

    expect(poolAnySpy).toHaveBeenCalledTimes(2);

    expect(getNodeIds(results[0].edges)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(getNodeIds(results[1].edges)).toEqual([
      10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
    ]);
  });

  it('caches loaded records', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const poolAnySpy = vi.spyOn(pool, 'any');
    poolAnySpy.mockClear();
    const poolOneFirstSpy = vi.spyOn(pool, 'oneFirst');
    const resultsA = await loader.load({
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });
    const resultsB = await loader.load({
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(poolAnySpy).toHaveBeenCalledTimes(1);
    expect(poolOneFirstSpy).toHaveBeenCalledTimes(1);
    expect(getNodeIds(resultsA.edges)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(getNodeIds(resultsB.edges)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('gets the count', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const result = await loader.load({
      info: getInfo(['count']),
      where: ({ name }) => sql.fragment`${name} = 'ccc'`,
    });

    expect(result.count).toEqual(2n);
  });

  it('gets the count without fetching edges', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const result = await loader.load({
      info: getInfo(['count']),
      where: ({ name }) => sql.fragment`${name} = 'ccc'`,
    });

    expect(result.count).toEqual(2n);
    expect(result.edges.length).toEqual(0);
  });

  it('gets the count without fetching edges (batch)', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const results = await Promise.all([
      loader.load({
        info: getInfo(['count']),
        where: ({ name }) => sql.fragment`${name} = 'ccc'`,
      }),
      loader.load({
        info: getInfo(['count']),
        where: ({ name }) => sql.fragment`${name} = 'eee'`,
      }),
    ]);

    expect(results[0].count).toEqual(2n);
    expect(results[0].edges.length).toEqual(0);
    expect(results[1].count).toEqual(2n);
    expect(results[1].edges.length).toEqual(0);
  });

  it('gets a mix of count and edges', async () => {
    const loader = new PersonConnectionLoader(pool, {});

    const results = await Promise.all([
      loader.load({
        info: getInfo(['edges']),
        where: ({ name }) => sql.fragment`${name} = 'eee'`,
      }),
      loader.load({
        info: getInfo(['count']),
        where: ({ name }) => sql.fragment`${name} = 'eee'`,
      }),
    ]);

    expect(results[0].count).toEqual(0);
    expect(results[1].count).toEqual(2n);
  });

  it('gets the edges without fetching edges', async () => {
    const loader = new PersonConnectionLoader(pool, {});
    const results = await Promise.all([
      loader.load({
        info: getInfo(['edges']),
        where: ({ name }) => sql.fragment`${name} = 'ccc'`,
      }),
      loader.load({
        info: getInfo(['pageInfo']),
        where: ({ name }) => sql.fragment`${name} = 'eee'`,
      }),
    ]);

    expect(results[0].count).toEqual(0);
    expect(results[0].edges.length).toEqual(2);
    expect(results[1].count).toEqual(0);
    expect(results[1].edges.length).toEqual(2);
  });
});

describe('createConnectionLoaderClass (with validation)', () => {
  let pool: DatabasePool;

  beforeAll(async () => {
    const createResultParserInterceptor = (): Interceptor => {
      return {
        transformRow: (executionContext, actualQuery, row) => {
          const { resultParser } = executionContext;

          // @ts-expect-error _any is not exposed through the zod typings, but does exist on ZodTypeAny
          if (!resultParser || resultParser._any) {
            return row;
          }

          const validationResult = resultParser.safeParse(row);

          if (validationResult.success !== true) {
            throw new SchemaValidationError(
              actualQuery,
              row,
              validationResult.error.issues,
            );
          }

          return validationResult.data as QueryResultRow;
        },
      };
    };

    pool = await createPool(POSTGRES_DSN, {
      interceptors: [createResultParserInterceptor()],
    });

    await pool.query(sql.unsafe`
      CREATE TABLE IF NOT EXISTS person (
        id integer NOT NULL PRIMARY KEY,
        uid text NOT NULL,
        name text NOT NULL
      );
    `);

    await pool.query(sql.unsafe`
      INSERT INTO person
        (id, uid, name)
      VALUES
        (1, 'a', 'aaa'),
        (2, 'b', 'aaa'),
        (3, 'c', 'bbb'),
        (4, 'd', 'bbb'),
        (5, 'e', 'ccc'),
        (6, 'f', 'ccc'),
        (7, 'g', 'ddd'),
        (8, 'h', 'ddd'),
        (9, 'i', 'eee'),
        (10, 'j', 'eee');
    `);
  });

  afterAll(async () => {
    if (pool) {
      await pool.query(sql.unsafe`
        DROP TABLE IF EXISTS person;
      `);

      await pool.end();
    }
  });

  it('fails with schema validation error', async () => {
    const BadConnectionLoader = createConnectionLoaderClass({
      query: sql.type(
        z.object({
          id: z.number(),
          uid: z.string(),
        }),
      )`
        SELECT
          *
        FROM person
      `,
    });

    const loader = new BadConnectionLoader(pool, {});
    await expect(loader.load({})).rejects.toThrowError(SchemaValidationError);
  });
});
