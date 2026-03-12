type StackFrame = {
  columnNumber: null | number;
  fileName: null | string;
  functionName: null | string;
  lineNumber: null | number;
};

// Matches V8 stack trace lines:
//   at functionName (file:line:col)
//   at functionName (file:line)
//   at file:line:col
const v8Re = /^\s*at (?:(.*?) ?\()?((?:\/|[a-z]:\\|\\\\|file:|node:).*?):(\d+)(?::(\d+))?\)?\s*$/iu;

export const getStackTrace = (): StackFrame[] => {
  // eslint-disable-next-line unicorn/error-message
  const stack = new Error().stack;

  if (!stack) {
    return [];
  }

  const frames: StackFrame[] = [];

  for (const line of stack.split("\n")) {
    const match = v8Re.exec(line);

    if (match) {
      frames.push({
        columnNumber: match[4] ? Number(match[4]) : null,
        fileName: match[2] ?? null,
        functionName: match[1] || null,
        lineNumber: match[3] ? Number(match[3]) : null,
      });
    }
  }

  // Remove the first frame (this function itself)
  return frames.slice(1);
};
