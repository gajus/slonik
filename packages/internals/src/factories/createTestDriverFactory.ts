import {
  createDriverFactory,
  type DriverFactory,
  type DriverQueryResult,
} from './createDriverFactory';

// matches two strings ignoring whitespace
const matchTemplate = (template, value) => {
  const templateString = template.replaceAll(/\s/gu, '');
  const valueString = value.replaceAll(/\s/gu, '');

  return templateString === valueString;
};

const matchQuery = (
  sql: string,
  queries: Record<string, DriverQueryResult>,
) => {
  for (const [template, result] of Object.entries(queries)) {
    if (matchTemplate(template, sql)) {
      return result;
    }
  }

  throw new Error(`Query not matched: ${sql}`);
};

/**
 * This is a test driver factory that is used for unit testing.
 */
export const createTestDriverFactory = (): DriverFactory => {
  return createDriverFactory(async () => {
    return {
      createPoolClient: async () => {
        return {
          connect: async () => {},
          end: async () => {},
          query: async (sql) => {
            return matchQuery(sql, {
              [`
                SELECT *
                FROM (VALUES (1)) as t(id)
              `]: {
                command: 'SELECT',
                fields: [
                  {
                    dataTypeId: 23,
                    name: 'id',
                  },
                ],
                rowCount: 1,
                rows: [
                  {
                    id: 1,
                  },
                ],
              },

              [`
                SELECT *
                FROM (VALUES (1)) as t(id)
                WHERE false
              `]: {
                command: 'SELECT',
                fields: [
                  {
                    dataTypeId: 23,
                    name: 'id',
                  },
                ],
                rowCount: 0,
                rows: [],
              },
              [`
                SELECT *
                FROM (VALUES (1), (2)) as t(id)
              `]: {
                command: 'SELECT',
                fields: [
                  {
                    dataTypeId: 23,
                    name: 'id',
                  },
                ],
                rowCount: 2,
                rows: [
                  {
                    id: 1,
                  },
                  {
                    id: 2,
                  },
                ],
              },
              [`
                SELECT *
                FROM (VALUES (1), (2)) as t(id)
                WHERE false
              `]: {
                command: 'SELECT',
                fields: [
                  {
                    dataTypeId: 23,
                    name: 'id',
                  },
                ],
                rowCount: 0,
                rows: [],
              },
              [`
                SELECT *
                FROM (VALUES (1, 'foo')) as t(id, name)
              `]: {
                command: 'SELECT',
                fields: [
                  {
                    dataTypeId: 23,
                    name: 'id',
                  },
                  {
                    dataTypeId: 25,
                    name: 'name',
                  },
                ],
                rowCount: 1,
                rows: [
                  {
                    id: 1,
                    name: 'foo',
                  },
                ],
              },
              COMMIT: {
                command: 'SELECT',
                fields: [],
                rowCount: 0,
                rows: [],
              },
              'DISCARD ALL': {
                command: 'SELECT',
                fields: [],
                rowCount: 0,
                rows: [],
              },
              ROLLBACK: {
                command: 'SELECT',
                fields: [],
                rowCount: 0,
                rows: [],
              },
              'ROLLBACK TO SAVEPOINT slonik_savepoint_1': {
                command: 'SELECT',
                fields: [],
                rowCount: 0,
                rows: [],
              },
              'SAVEPOINT slonik_savepoint_1': {
                command: 'SELECT',
                fields: [],
                rowCount: 0,
                rows: [],
              },
              'SELECT 1': {
                command: 'SELECT',
                fields: [],
                rowCount: 1,
                rows: [
                  {
                    1: 1,
                  },
                ],
              },
              'START TRANSACTION': {
                command: 'SELECT',
                fields: [],
                rowCount: 0,
                rows: [],
              },
            });
          },
          stream: () => {
            throw new Error('Not implemented.');
          },
        };
      },
    };
  });
};
