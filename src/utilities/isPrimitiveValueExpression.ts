export const isPrimitiveValueExpression = (maybe: unknown): maybe is boolean | number | string | null => {
  return typeof maybe === 'string' || typeof maybe === 'number' || typeof maybe === 'boolean' || maybe === null;
};
