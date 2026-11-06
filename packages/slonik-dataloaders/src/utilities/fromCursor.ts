// A cursor is a JSON array of the values of the ORDER BY columns. The values are bound as query
// parameters, which can only be done with scalar values.
export const fromCursor = (cursor: string): Array<boolean | null | number | string> => {
  return JSON.parse(Buffer.from(cursor, "base64").toString());
};
