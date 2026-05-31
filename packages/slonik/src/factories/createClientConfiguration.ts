import type { ClientConfiguration, ClientConfigurationInput } from "../types.js";
import { createTypeParserPreset } from "./createTypeParserPreset.js";
import type { DriverTypeParser } from "@slonik/driver";
import { InvalidConfigurationError } from "@slonik/errors";

export const createClientConfiguration = (
  connectionUri: string,
  clientUserConfigurationInput?: ClientConfigurationInput,
): ClientConfiguration => {
  const typeParsers: readonly DriverTypeParser[] = [];

  const definedUserConfiguration = Object.fromEntries(
    Object.entries(clientUserConfigurationInput ?? {}).filter(([, v]) => v !== undefined),
  );

  const configuration = {
    captureStackTrace: false,
    connectionRetryLimit: 3,
    connectionTimeout: 5_000,
    connectionUri,
    dangerouslyAllowForeignConnections: false,
    gracefulTerminationTimeout: 5_000,
    idleInTransactionSessionTimeout: 60_000,
    idleTimeout: 5_000,
    interceptors: [],
    queryRetryLimit: 5,
    resetConnection: ({ query }) => {
      return query(`DISCARD ALL`);
    },
    statementTimeout: 60_000,
    tracing: false,
    transactionRetryLimit: 5,
    typeParsers,
    ...definedUserConfiguration,
    // `maximumPoolSize` and `minimumPoolSize` are deprecated aliases of
    // `maxPoolSize` and `minPoolSize`. The new names take precedence when both
    // are provided; otherwise we fall back to the deprecated name, then the
    // default.
    maxPoolSize:
      clientUserConfigurationInput?.maxPoolSize ??
      clientUserConfigurationInput?.maximumPoolSize ??
      10,
    minPoolSize:
      clientUserConfigurationInput?.minPoolSize ??
      clientUserConfigurationInput?.minimumPoolSize ??
      0,
  };

  if (configuration.maxPoolSize < 1) {
    throw new InvalidConfigurationError("maxPoolSize must be equal to or greater than 1.");
  }

  if (configuration.minPoolSize < 0) {
    throw new InvalidConfigurationError("minPoolSize must be equal to or greater than 0.");
  }

  if (configuration.maxPoolSize < configuration.minPoolSize) {
    throw new InvalidConfigurationError(
      "maxPoolSize must be equal to or greater than minPoolSize.",
    );
  }

  if (!configuration.typeParsers || configuration.typeParsers === typeParsers) {
    configuration.typeParsers = createTypeParserPreset();
  }

  return configuration;
};
