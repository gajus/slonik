export const createErrorWithCode = (code: string) => {
  const error = new Error('foo');

  // @ts-expect-error
  error.code = code;

  return error;
};
