export const createErrorWithCode = (code: string) => {
  const error = new Error('foo');

  // @ts-expect-error - This is a test helper.
  error.code = code;

  return error;
};
