import { createDriverFactory, type DriverFactory } from './createDriverFactory';

// matches two strings ignoring whitespace
const matchTemplate = (template, value) => {
  const templateString = template.replaceAll(/\s/gu, '');
  const valueString = value.replaceAll(/\s/gu, '');

  return templateString === valueString;
};

export const createTestDriverFactory = (): DriverFactory => {
  return createDriverFactory(async () => {
    return {
      createPoolClient: async () => {
        return {
          connect: async () => {},
          end: async () => {},
          query: async (sql) => {
            if (matchTemplate(sql, 'DISCARD ALL')) {
              return {
                command: 'DISCARD ALL',
              };
            }

            if (matchTemplate(sql, 'START TRANSACTION')) {
              return {
                command: 'START TRANSACTION',
              };
            }

            if (matchTemplate(sql, 'SAVEPOINT slonik_savepoint_1')) {
              return {
                command: 'SAVEPOINT',
              };
            }

            if (
              matchTemplate(sql, 'ROLLBACK TO SAVEPOINT slonik_savepoint_1')
            ) {
              return {
                command: 'ROLLBACK TO SAVEPOINT',
              };
            }

            if (matchTemplate(sql, 'ROLLBACK')) {
              return {
                command: 'ROLLBACK',
              };
            }

            if (matchTemplate(sql, 'COMMIT')) {
              return {
                command: 'COMMIT',
              };
            }

            if (matchTemplate(sql, 'SELECT 1')) {
              return {
                command: 'SELECT',
                fields: [],
                notices: [],
                rowCount: 1,
                rows: [
                  {
                    1: 1,
                  },
                ],
                type: 'QueryResult',
              };
            }

            if (
              matchTemplate(
                sql,
                `
                  SELECT *
                  FROM (VALUES (1)) as t(id)
                  WHERE false
                `,
              )
            ) {
              return {
                command: 'SELECT',
                fields: [
                  {
                    dataTypeId: 23,
                    name: 'id',
                  },
                ],
                rowCount: 0,
                rows: [],
              };
            }

            if (
              matchTemplate(
                sql,
                `
                  SELECT *
                  FROM (VALUES (1), (2)) as t(id)
                `,
              )
            ) {
              return {
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
              };
            }

            if (
              matchTemplate(
                sql,
                `
                  SELECT *
                  FROM (VALUES (1, 'foo')) as t(id, name)
                `,
              )
            ) {
              return {
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
              };
            }

            if (
              matchTemplate(
                sql,
                `
                  SELECT *
                  FROM (VALUES (1), (2)) as t(id)
                  WHERE false
                `,
              )
            ) {
              return {
                command: 'SELECT',
                fields: [
                  {
                    dataTypeId: 23,
                    name: 'id',
                  },
                ],
                rowCount: 0,
                rows: [],
              };
            }

            if (
              matchTemplate(
                sql,
                `
                  SELECT *
                  FROM (VALUES (1)) as t(id)
                `,
              )
            ) {
              return {
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
              };
            }

            console.log({ sql });

            throw new Error('Unexpected query.');
          },
          stream: () => {
            throw new Error('Not implemented.');
          },
        };
      },
    };
  });
};
