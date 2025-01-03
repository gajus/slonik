import { type IdentifierSqlToken } from 'slonik';

export type ColumnIdentifiers<TResult> = Record<
  keyof TResult,
  IdentifierSqlToken
>;

export type Connection<TResult> = {
  count: number;
  edges: Array<TResult & { cursor: string; node: TResult }>;
  pageInfo: PageInfo;
};

export type OrderDirection = 'ASC' | 'DESC';

type PageInfo = {
  endCursor: null | string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: null | string;
};
