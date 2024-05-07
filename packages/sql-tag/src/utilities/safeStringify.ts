import { configure } from 'safe-stable-stringify';

const stringify = configure({
  bigint: true,
  circularValue: '[Circular]',
  strict: true,
});

export const safeStringify = (
  subject: unknown,
  replacer?:
    | Array<number | string>
    | ((key: string, value: unknown) => unknown)
    | null
    | undefined,
  space?: number | string,
): string => {
  const result = stringify(subject, replacer, space);

  if (result === undefined) {
    throw new Error('Expected result to be string');
  }

  return result;
};
