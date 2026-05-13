type StackFrame = {
  columnNumber: null | number;
  fileName: null | string;
  functionName: null | string;
  lineNumber: null | number;
};

const returnCallSites = (_error: Error, callSites: NodeJS.CallSite[]) => callSites;

export const getStackTrace = (): StackFrame[] => {
  const originalPrepare = Error.prepareStackTrace;

  try {
    Error.prepareStackTrace = returnCallSites;

    const error = {} as { stack: NodeJS.CallSite[] };
    Error.captureStackTrace(error);
    const callSites = error.stack;

    const count = callSites.length - 1;
    const frames = Array.from<StackFrame>({ length: count });

    for (let i = 0; i < count; i++) {
      const site = callSites[i + 1];

      frames[i] = {
        columnNumber: site.getColumnNumber(),
        fileName: site.getFileName() ?? null,
        functionName: site.getFunctionName() ?? null,
        lineNumber: site.getLineNumber(),
      };
    }

    return frames;
  } finally {
    Error.prepareStackTrace = originalPrepare;
  }
};
