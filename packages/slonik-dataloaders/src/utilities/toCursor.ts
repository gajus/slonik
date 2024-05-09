import { type QueryResultRowColumn } from 'slonik';

export const toCursor = (ids: QueryResultRowColumn[]): string => {
  return Buffer.from(JSON.stringify(ids)).toString('base64');
};
