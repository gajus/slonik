import { type TypeParser } from '../types';
import { type PoolClient } from 'pg';
import { getTypeParser } from 'pg-types';
import { parse as parseArray } from 'postgres-array';

type PostgresType = {
  oid: string;
  typarray: string;
  typname: string;
};

export const createTypeOverrides = async (
  connection: PoolClient,
  typeParsers: readonly TypeParser[],
) => {
  const typeNames = typeParsers.map((typeParser) => {
    return typeParser.name;
  });

  const postgresTypes: PostgresType[] = (
    await connection.query(
      'SELECT oid, typarray, typname FROM pg_type WHERE typname = ANY($1::text[])',
      [typeNames],
    )
  ).rows;

  const parsers = {};

  for (const typeParser of typeParsers) {
    const postgresType = postgresTypes.find((maybeTargetPostgresType) => {
      return maybeTargetPostgresType.typname === typeParser.name;
    });

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

    return getTypeParser(oid);
  };
};
