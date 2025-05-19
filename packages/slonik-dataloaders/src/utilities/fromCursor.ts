import type { QueryResultRowColumn } from 'slonik';

export const fromCursor = (cursor: string): QueryResultRowColumn[] => {
  return JSON.parse(Buffer.from(cursor, 'base64').toString());
};
