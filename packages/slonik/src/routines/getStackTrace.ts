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

    // Skip frame 0 (this function itself)
    const frames: StackFrame[] = [];

    for (let i = 1; i < callSites.length; i++) {
      const site = callSites[i];

      frames.push({
        columnNumber: site.getColumnNumber(),
        fileName: site.getFileName() ?? null,
        functionName: site.getFunctionName() ?? null,
        lineNumber: site.getLineNumber(),
      });
    }

    return frames;
  } finally {
    Error.prepareStackTrace = originalPrepare;
  }
};
