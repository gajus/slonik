import { type IdentifierSqlToken } from 'slonik';

export type OrderDirection = 'ASC' | 'DESC';

export type ColumnIdentifiers<TResult> = Record<
  keyof TResult,
  IdentifierSqlToken
>;

type PageInfo = {
  endCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
};

export type Connection<TResult> = {
  count: number;
  edges: Array<TResult & { cursor: string; node: TResult }>;
  pageInfo: PageInfo;
};
