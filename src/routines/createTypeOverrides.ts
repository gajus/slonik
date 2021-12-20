import type {
  PoolClient as PgPoolClient,
} from 'pg';
import TypeOverrides from 'pg/lib/type-overrides';
import {
  parse as parseArray,
} from 'postgres-array';
import type {
  TypeOverrides as TypeOverridesType,
  TypeParser,
} from '../types';

type PostgresType = {
  oid: string,
  typarray: string,
  typname: string,
};

export const createTypeOverrides = async (
  connection: PgPoolClient,
  typeParsers: readonly TypeParser[],
): Promise<TypeOverridesType> => {
  const typeOverrides = new TypeOverrides();

  if (typeParsers.length === 0) {
    return typeOverrides;
  }

  const typeNames = typeParsers.map((typeParser) => {
    return typeParser.name;
  });

  const postgresTypes: PostgresType[] = (
    await connection.query('SELECT oid, typarray, typname FROM pg_type WHERE typname = ANY($1::text[])', [
      typeNames,
    ])
  ).rows;

  for (const typeParser of typeParsers) {
    const postgresType = postgresTypes.find((maybeTargetPostgresType) => {
      return maybeTargetPostgresType.typname === typeParser.name;
    });

    if (!postgresType) {
      throw new Error('Database type "' + typeParser.name + '" not found.');
    }

    typeOverrides.setTypeParser(postgresType.oid, (value) => {
      return typeParser.parse(value);
    });

    if (postgresType.typarray) {
      typeOverrides.setTypeParser(postgresType.typarray, (arrayValue) => {
        return parseArray(arrayValue)
          .map((value) => {
            return typeParser.parse(value);
          });
      });
    }
  }

  return typeOverrides;
};
