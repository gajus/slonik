import { type IdentifierSqlToken } from 'slonik';

export type OrderDirection = 'ASC' | 'DESC';

export type ColumnIdentifiers<TResult> = Record<
  keyof TResult,
  IdentifierSqlToken
>;

type PageInfo = {
  endCursor: null | string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: null | string;
};

export type Connection<TResult> = {
  count: number;
  edges: Array<{ cursor: string; node: TResult } & TResult>;
  pageInfo: PageInfo;
};
