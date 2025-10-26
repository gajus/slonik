import { configure } from 'safe-stable-stringify';

const stringify = configure({
  bigint: true,
  circularValue: '[Circular]',
  strict: true,
});

export const safeStringify = (subject: unknown): string => {
  try {
    return JSON.stringify(subject);
  } catch {
    // Ignore
  }

  const result = stringify(subject);

  if (result === undefined) {
    throw new Error('Expected result to be string');
  }

  return result;
};
