/* eslint-disable canonical/id-match */

import { createDriverFactory } from "@slonik/driver";
import type {
  DriverCommand,
  DriverConfiguration,
  DriverFactory,
  DriverTypeParser,
} from "@slonik/driver";
import {
  BackendTerminatedError,
  BackendTerminatedUnexpectedlyError,
  CheckExclusionConstraintViolationError,
  CheckIntegrityConstraintViolationError,
  ForeignKeyIntegrityConstraintViolationError,
  IdleTransactionTimeoutError,
  InputSyntaxError,
  InvalidInputError,
  NotNullIntegrityConstraintViolationError,
  StatementCancelledError,
  StatementTimeoutError,
  UnexpectedStateError,
  UniqueIntegrityConstraintViolationError,
} from "@slonik/errors";
import type { PrimitiveValueExpression } from "@slonik/sql-tag";
import type { Field, Query } from "@slonik/types";
import { parseDsn } from "@slonik/utilities";
import { Transform } from "node:stream";
import { Client } from "pg";
import type {
  CustomTypesConfig,
  DatabaseError,
  ClientConfig as NativePostgresClientConfiguration,
} from "pg";
import QueryStream from "pg-query-stream";
import { getTypeParser as getNativeTypeParser } from "pg-types";
import { parse as parseArray } from "postgres-array";

type PostgresType = {
  oid: string;
  typarray: string;
  typname: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypeOverrides = (oid: number) => any;

const queryPostgresTypes = async (
  connection: Client,
  typeNames: readonly string[],
): Promise<PostgresType[]> => {
  return (
    await connection.query(
      `
        SELECT
          oid,
          typarray,
          typname
        FROM pg_type
        WHERE typname = ANY($1::text[])
      `,
      [typeNames],
    )
  ).rows as PostgresType[];
};

const cachePostgresTypes = (
  postgresTypeCache: Map<string, PostgresType>,
  postgresTypes: readonly PostgresType[],
) => {
  for (const postgresType of postgresTypes) {
    // Type names are unique only within a schema. Keep the first match.
    if (!postgresTypeCache.has(postgresType.typname)) {
      postgresTypeCache.set(postgresType.typname, postgresType);
    }
  }
};

const createTypeOverrides = (
  postgresTypeCache: ReadonlyMap<string, PostgresType>,
  typeParsers: readonly DriverTypeParser[],
  fallback: TypeOverrides,
): TypeOverrides => {
  const parsers = {};

  for (const typeParser of typeParsers) {
    const postgresType = postgresTypeCache.get(typeParser.name);

    if (!postgresType) {
      throw new Error('Database type "' + typeParser.name + '" not found.');
    }

    parsers[postgresType.oid] = (value) => {
      return typeParser.parse(value);
    };

    if (postgresType.typarray) {
      parsers[postgresType.typarray] = (arrayValue) => {
        return parseArray(arrayValue).map((value) => {
          return typeParser.parse(value);
        });
      };
    }
  }

  return (oid: number) => {
    if (parsers[oid]) {
      return parsers[oid];
    }

    return fallback(oid);
  };
};

const createClientConfiguration = (
  clientConfiguration: DriverConfiguration,
): NativePostgresClientConfiguration => {
  const connectionOptions = parseDsn(clientConfiguration.connectionUri);

  const poolConfiguration: NativePostgresClientConfiguration = {
    application_name: connectionOptions.applicationName,
    database: connectionOptions.databaseName,
    host: connectionOptions.host,
    options: connectionOptions.options,
    password: clientConfiguration.password ?? connectionOptions.password,
    port: connectionOptions.port,
    // @ts-expect-error - https://github.com/brianc/node-postgres/pull/3214
    queryMode: "extended",
    ssl: false,
    user: connectionOptions.username,
  };

  if (clientConfiguration.ssl) {
    poolConfiguration.ssl = clientConfiguration.ssl;
  } else if (connectionOptions.sslMode === "disable") {
    poolConfiguration.ssl = false;
  } else if (connectionOptions.sslMode === "require") {
    poolConfiguration.ssl = true;
  } else if (connectionOptions.sslMode === "no-verify") {
    poolConfiguration.ssl = {
      rejectUnauthorized: false,
    };
  }

  if (clientConfiguration.connectionTimeout !== "DISABLE_TIMEOUT") {
    if (clientConfiguration.connectionTimeout === 0) {
      poolConfiguration.connectionTimeoutMillis = 1;
    } else {
      poolConfiguration.connectionTimeoutMillis = clientConfiguration.connectionTimeout;
    }
  }

  if (clientConfiguration.statementTimeout !== "DISABLE_TIMEOUT") {
    if (clientConfiguration.statementTimeout === 0) {
      poolConfiguration.statement_timeout = 1;
    } else {
      poolConfiguration.statement_timeout = clientConfiguration.statementTimeout;
    }
  }

  if (clientConfiguration.idleInTransactionSessionTimeout !== "DISABLE_TIMEOUT") {
    if (clientConfiguration.idleInTransactionSessionTimeout === 0) {
      poolConfiguration.idle_in_transaction_session_timeout = 1;
    } else {
      poolConfiguration.idle_in_transaction_session_timeout =
        clientConfiguration.idleInTransactionSessionTimeout;
    }
  }

  return poolConfiguration;
};

const queryPoolPostgresTypes = async (
  pgClientConfiguration: NativePostgresClientConfiguration,
  driverConfiguration: DriverConfiguration,
): Promise<PostgresType[]> => {
  const client = new Client(pgClientConfiguration);

  try {
    await client.connect();
    return await queryPostgresTypes(
      client,
      driverConfiguration.typeParsers.map((typeParser) => {
        return typeParser.name;
      }),
    );
  } finally {
    await client.end();
  }
};

const isErrorWithCode = (error: Error): error is DatabaseError => {
  return "code" in error;
};

// query is not available for connection-level errors.
// TODO evaluate if we can remove query from the error object.
// I suspect we should not be even using InputSyntaxError as one of the error types.
// @see https://github.com/gajus/slonik/issues/557
const wrapError = (error: Error, query: null | Query) => {
  if (error.message.toLowerCase().includes("connection terminated unexpectedly")) {
    return new BackendTerminatedUnexpectedlyError(error);
  }

  if (error.message.toLowerCase().includes("connection terminated")) {
    return new BackendTerminatedError(error);
  }

  if (!isErrorWithCode(error)) {
    return error;
  }

  if (error.code === "22P02") {
    return new InvalidInputError(error.message);
  }

  if (error.code === "25P03") {
    return new IdleTransactionTimeoutError(error);
  }

  if (error.code === "57P01") {
    return new BackendTerminatedError(error);
  }

  if (
    error.code === "57014" &&
    // The code alone is not enough to distinguish between a statement timeout and a statement cancellation.
    error.message.includes("canceling statement due to user request")
  ) {
    return new StatementCancelledError(error);
  }

  if (error.code === "57014") {
    return new StatementTimeoutError(error);
  }

  if (error.code === "23502") {
    return new NotNullIntegrityConstraintViolationError(error);
  }

  if (error.code === "23503") {
    return new ForeignKeyIntegrityConstraintViolationError(error);
  }

  if (error.code === "23505") {
    return new UniqueIntegrityConstraintViolationError(error);
  }

  if (error.code === "23P01") {
    return new CheckExclusionConstraintViolationError(error);
  }

  if (error.code === "23514") {
    return new CheckIntegrityConstraintViolationError(error);
  }

  if (error.code === "42601") {
    if (!query) {
      return new UnexpectedStateError("Expected query to be provided");
    }

    return new InputSyntaxError(error, query);
  }

  return error;
};

export const createPgDriverFactory = (): DriverFactory => {
  return createDriverFactory(async ({ driverConfiguration }) => {
    const clientConfiguration = createClientConfiguration(driverConfiguration);

    // Postgres types by name. Starts with the types named by the pool's type parsers;
    // types named only by per-query type parsers are looked up the first time they are used.
    const postgresTypeCache = new Map<string, PostgresType>();

    cachePostgresTypes(
      postgresTypeCache,
      await queryPoolPostgresTypes(clientConfiguration, driverConfiguration),
    );

    const getTypeParser = createTypeOverrides(
      postgresTypeCache,
      driverConfiguration.typeParsers,
      getNativeTypeParser,
    );

    // eslint-disable-next-line require-atomic-updates
    clientConfiguration.types = {
      getTypeParser,
    };

    // Per-query type parsers take precedence over the pool's type parsers for the types they name.
    const createQueryTypes = async (client: Client, typeParsers: readonly DriverTypeParser[]) => {
      const uncachedTypeNames = typeParsers
        .map((typeParser) => {
          return typeParser.name;
        })
        .filter((typeName) => {
          return !postgresTypeCache.has(typeName);
        });

      if (uncachedTypeNames.length > 0) {
        cachePostgresTypes(postgresTypeCache, await queryPostgresTypes(client, uncachedTypeNames));
      }

      return {
        getTypeParser: createTypeOverrides(postgresTypeCache, typeParsers, getTypeParser),
      };
    };

    return {
      createPoolClient: async ({ clientEventEmitter }) => {
        let perConnectionConfig = clientConfiguration;

        if (typeof driverConfiguration.password === "function") {
          const resolvedPassword = await driverConfiguration.password();
          perConnectionConfig = { ...clientConfiguration, password: resolvedPassword };
        }

        const client = new Client(perConnectionConfig);

        // We will see this triggered when the connection is terminated, e.g.
        // "terminates transactions that are idle beyond idleInTransactionSessionTimeout" test.
        const onError = (error) => {
          clientEventEmitter.emit("error", wrapError(error, null));
        };

        const onNotice = (notice) => {
          if (notice.message) {
            clientEventEmitter.emit("notice", {
              message: notice.message,
            });
          }
        };

        client.on("error", onError);
        client.on("notice", onNotice);

        return {
          connect: async () => {
            try {
              await client.connect();
            } catch (error) {
              client.removeListener("error", onError);
              client.removeListener("notice", onNotice);

              throw error;
            }
          },
          end: async () => {
            await client.end();

            client.removeListener("error", onError);
            client.removeListener("notice", onNotice);
          },
          query: async (sql, values, queryOptions) => {
            let result;

            try {
              // Use query config object when statement name or per-query type parsers are provided
              // to enable PostgreSQL named prepared statements and per-query type parsing
              if (queryOptions?.name || queryOptions?.typeParsers?.length) {
                result = await client.query({
                  name: queryOptions.name,
                  text: sql,
                  types: queryOptions.typeParsers?.length
                    ? await createQueryTypes(client, queryOptions.typeParsers)
                    : undefined,
                  values: values as unknown[],
                });
              } else {
                result = await client.query(sql, values as unknown[]);
              }
            } catch (error) {
              throw wrapError(error, {
                sql,
                values: values as readonly PrimitiveValueExpression[],
              });
            }

            if (Array.isArray(result)) {
              throw new InvalidInputError("Must not use multiple statements in a single query.");
            }

            return {
              command: result.command as DriverCommand,
              fields: result.fields.map((field) => {
                return {
                  dataTypeId: field.dataTypeID,
                  name: field.name,
                };
              }),
              rowCount: result.rowCount,
              rows: result.rows,
            };
          },
          stream: (sql, values, streamOptions) => {
            let fields: readonly Field[] = [];

            // `rowDescription` will not fire if the query produces a syntax error.
            // Also, `rowDescription` won't fire until client starts consuming the stream.
            // This is why we cannot simply await for `rowDescription` event before starting to pipe the stream.
            const onRowDescription = (rowDescription) => {
              fields = rowDescription.fields.map((field) => {
                return {
                  dataTypeId: field.dataTypeID,
                  name: field.name,
                };
              });
            };

            const transform = new Transform({
              objectMode: true,
              async transform(datum, enc, callback) {
                if (!fields) {
                  callback(new Error("Fields not available"));

                  return;
                }

                this.push({
                  fields,
                  row: datum,
                });

                callback();
              },
            });

            const startStream = (types?: CustomTypesConfig) => {
              const stream = client.query(new QueryStream(sql, values as unknown[], { types }));

              client.connection.once("rowDescription", onRowDescription);

              stream.once("close", () => {
                client.connection.removeListener("rowDescription", onRowDescription);
              });

              stream.on("error", (error) => {
                transform.emit(
                  "error",
                  wrapError(error, {
                    sql,
                    values: values as PrimitiveValueExpression[],
                  }),
                );
              });

              stream.pipe(transform);
            };

            const typeParsers = streamOptions?.typeParsers;

            if (typeParsers?.length) {
              // Resolving per-query type parsers may require a lookup query,
              // so the stream starts once they are resolved.
              // eslint-disable-next-line promise/prefer-await-to-then
              createQueryTypes(client, typeParsers).then(
                (types) => {
                  // The consumer may have destroyed the stream in the meantime.
                  if (!transform.destroyed) {
                    startStream(types);
                  }
                },
                (error) => {
                  transform.destroy(
                    wrapError(error, {
                      sql,
                      values: values as PrimitiveValueExpression[],
                    }),
                  );
                },
              );
            } else {
              startStream();
            }

            return transform;
          },
        };
      },
    };
  });
};
