import { createConnectionLoaderClass } from './createConnectionLoaderClass';
import {
  type FieldNode,
  type GraphQLResolveInfo,
  type OperationDefinitionNode,
  parse,
} from 'graphql';
import { createPool, type DatabasePool, sql } from 'slonik';
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

const BarConnectionLoader = createConnectionLoaderClass({
  query: sql.type(
    z.object({
      id: z.number(),
      uid: z.string(),
      value: z.string(),
    }),
  )`
    SELECT
      *
    FROM test_table_bar
  `,
});

describe('createConnectionLoaderClass', () => {
  let pool: DatabasePool;

  beforeAll(async () => {
    pool = await createPool(POSTGRES_DSN);

    await pool.query(sql.unsafe`
      CREATE TABLE IF NOT EXISTS test_table_bar (
        id integer NOT NULL PRIMARY KEY,
        uid text NOT NULL,
        value text NOT NULL
      );
    `);

    await pool.query(sql.unsafe`
      INSERT INTO test_table_bar
        (id, uid, value)
      VALUES
        (1, 'z', 'aaa'),
        (2, 'y', 'aaa'),
        (3, 'x', 'bbb'),
        (4, 'w', 'bbb'),
        (5, 'v', 'ccc'),
        (6, 'u', 'ccc'),
        (7, 't', 'ddd'),
        (8, 's', 'ddd'),
        (9, 'r', 'eee');
    `);
  });

  afterAll(async () => {
    if (pool) {
      await pool.query(sql.unsafe`
        DROP TABLE IF EXISTS test_table_bar;
      `);

      await pool.end();
    }
  });

  it('loads all records with no additional options', async () => {
    const loader = new BarConnectionLoader(pool, {});
    const result = await loader.load({});

    expect(result).toMatchObject({
      pageInfo: {
        endCursor: result.edges[8].cursor,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: result.edges[0].cursor,
      },
    });
    expect(result.edges).toHaveLength(9);
  });

  it('loads records in ascending order', async () => {
    const loader = new BarConnectionLoader(pool, {});
    const result = await loader.load({
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(result.edges[0].node.id).toEqual(9);
    expect(result.edges[8].node.id).toEqual(1);
  });

  it('loads records in descending order', async () => {
    const loader = new BarConnectionLoader(pool, {});
    const result = await loader.load({
      orderBy: ({ uid }) => [[uid, 'DESC']],
    });

    expect(result.edges[0].node.id).toEqual(1);
    expect(result.edges[8].node.id).toEqual(9);
  });

  it('loads records with multiple order by expressions', async () => {
    const loader = new BarConnectionLoader(pool, {});
    const result = await loader.load({
      orderBy: ({ uid, value }) => [
        [value, 'DESC'],
        [uid, 'DESC'],
      ],
    });

    expect(result.edges[0].node.id).toEqual(9);
    expect(result.edges[8].node.id).toEqual(2);
  });

  it('loads records with complex order by expression', async () => {
    const loader = new BarConnectionLoader(pool, {});
    const result = await loader.load({
      orderBy: ({ uid }) => [[sql.fragment`upper(${uid})`, 'ASC']],
    });

    expect(result.edges[0].node.id).toEqual(9);
    expect(result.edges[8].node.id).toEqual(1);
  });

  it('loads records with where expression', async () => {
    const loader = new BarConnectionLoader(pool, {});
    const result = await loader.load({
      where: ({ value }) => sql.fragment`upper(${value}) = 'EEE'`,
    });

    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].node.id).toEqual(9);
  });

  it('paginates through the records forwards', async () => {
    const loader = new BarConnectionLoader(pool, {});
    const firstResult = await loader.load({
      limit: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(firstResult.edges).toHaveLength(4);
    expect(firstResult.edges[0].node.id).toEqual(9);
    expect(firstResult.edges[3].node.id).toEqual(6);
    expect(firstResult.pageInfo).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: false,
    });

    const secondResult = await loader.load({
      cursor: firstResult.pageInfo.endCursor,
      limit: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(secondResult.edges).toHaveLength(4);
    expect(secondResult.edges[0].node.id).toEqual(5);
    expect(secondResult.edges[3].node.id).toEqual(2);
    expect(secondResult.pageInfo).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: true,
    });

    const thirdResult = await loader.load({
      cursor: secondResult.pageInfo.endCursor,
      limit: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(thirdResult.edges).toHaveLength(1);
    expect(thirdResult.edges[0].node.id).toEqual(1);
    expect(thirdResult.pageInfo).toMatchObject({
      hasNextPage: false,
      hasPreviousPage: true,
    });

    const fourthResult = await loader.load({
      cursor: thirdResult.pageInfo.endCursor,
      limit: 4,
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(fourthResult.edges).toHaveLength(0);
    expect(fourthResult.pageInfo).toMatchObject({
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it('paginates through the records backwards', async () => {
    const loader = new BarConnectionLoader(pool, {});
    const firstResult = await loader.load({
      limit: 4,
      orderBy: ({ value, uid }) => [
        [value, 'ASC'],
        [uid, 'ASC'],
      ],
      reverse: true,
    });

    expect(firstResult.edges).toHaveLength(4);
    expect(firstResult.edges[0].node.id).toEqual(5);
    expect(firstResult.edges[3].node.id).toEqual(9);
    expect(firstResult.pageInfo).toMatchObject({
      hasNextPage: false,
      hasPreviousPage: true,
    });

    const secondResult = await loader.load({
      cursor: firstResult.pageInfo.startCursor,
      limit: 4,
      orderBy: ({ value, uid }) => [
        [value, 'ASC'],
        [uid, 'ASC'],
      ],
      reverse: true,
    });

    expect(secondResult.edges).toHaveLength(4);
    expect(secondResult.edges[0].node.id).toEqual(1);
    expect(secondResult.edges[3].node.id).toEqual(6);
    expect(secondResult.pageInfo).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: true,
    });

    const thirdResult = await loader.load({
      cursor: secondResult.pageInfo.startCursor,
      limit: 4,
      orderBy: ({ value, uid }) => [
        [value, 'ASC'],
        [uid, 'ASC'],
      ],
      reverse: true,
    });

    expect(thirdResult.edges).toHaveLength(1);
    expect(thirdResult.edges[0].node.id).toEqual(2);
    expect(thirdResult.pageInfo).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: false,
    });

    const fourthResult = await loader.load({
      cursor: thirdResult.pageInfo.startCursor,
      limit: 4,
      orderBy: ({ value, uid }) => [
        [value, 'ASC'],
        [uid, 'ASC'],
      ],
      reverse: true,
    });

    expect(fourthResult.edges).toHaveLength(0);
    expect(fourthResult.pageInfo).toMatchObject({
      hasNextPage: true,
      hasPreviousPage: false,
    });
  });

  it('batches loaded records', async () => {
    const loader = new BarConnectionLoader(pool, {});
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
    expect(results[0].edges[0].node.id).toEqual(9);
    expect(results[0].edges[8].node.id).toEqual(1);
    expect(results[1].edges[0].node.id).toEqual(1);
    expect(results[1].edges[8].node.id).toEqual(9);
  });

  it('caches loaded records', async () => {
    const loader = new BarConnectionLoader(pool, {});
    const poolAnySpy = vi.spyOn(pool, 'any');
    poolAnySpy.mockClear();
    const resultsA = await loader.load({
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });
    const resultsB = await loader.load({
      orderBy: ({ uid }) => [[uid, 'ASC']],
    });

    expect(poolAnySpy).toHaveBeenCalledTimes(2);
    expect(resultsA.edges[0].node.id).toEqual(9);
    expect(resultsA.edges[8].node.id).toEqual(1);
    expect(resultsB.edges[0].node.id).toEqual(9);
    expect(resultsB.edges[8].node.id).toEqual(1);
  });

  it('gets the count', async () => {
    const loader = new BarConnectionLoader(pool, {});
    const results = await Promise.all([
      loader.load({
        info: getInfo(['edges', 'count']),
        where: ({ value }) => sql.fragment`upper(${value}) = 'CCC'`,
      }),
      loader.load({
        info: getInfo(['edges', 'count']),
        where: ({ value }) => sql.fragment`upper(${value}) = 'EEE'`,
      }),
    ]);

    expect(results[0].count).toEqual(2n);
    expect(results[1].count).toEqual(1n);
  });

  it('gets the count without fetching edges', async () => {
    const loader = new BarConnectionLoader(pool, {});
    const results = await Promise.all([
      loader.load({
        info: getInfo(['count']),
        where: ({ value }) => sql.fragment`upper(${value}) = 'CCC'`,
      }),
      loader.load({
        info: getInfo(['count']),
        where: ({ value }) => sql.fragment`upper(${value}) = 'EEE'`,
      }),
    ]);

    expect(results[0].count).toEqual(2n);
    expect(results[0].edges.length).toEqual(0);
    expect(results[1].count).toEqual(1n);
    expect(results[1].edges.length).toEqual(0);
  });

  it('gets the edges without fetching edges', async () => {
    const loader = new BarConnectionLoader(pool, {});
    const results = await Promise.all([
      loader.load({
        info: getInfo(['edges']),
        where: ({ value }) => sql.fragment`upper(${value}) = 'CCC'`,
      }),
      loader.load({
        info: getInfo(['pageInfo']),
        where: ({ value }) => sql.fragment`upper(${value}) = 'EEE'`,
      }),
    ]);

    expect(results[0].count).toEqual(0);
    expect(results[0].edges.length).toEqual(2);
    expect(results[1].count).toEqual(0);
    expect(results[1].edges.length).toEqual(1);
  });
});
