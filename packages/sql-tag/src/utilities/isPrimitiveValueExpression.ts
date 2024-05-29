export const isPrimitiveValueExpression = (
  maybe: unknown,
): maybe is bigint | boolean | number | string | null => {
  return (
    typeof maybe === 'string' ||
    typeof maybe === 'number' ||
    typeof maybe === 'boolean' ||
    typeof maybe === 'bigint' ||
    maybe === null
  );
};
