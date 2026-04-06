type StackFrame = {
  columnNumber: null | number;
  fileName: null | string;
  functionName: null | string;
  lineNumber: null | number;
};

export const getStackTrace = (): StackFrame[] => {
  const originalPrepare = Error.prepareStackTrace;

  Error.prepareStackTrace = (_error, callSites) => callSites;

  const error = {} as { stack: NodeJS.CallSite[] };
  Error.captureStackTrace(error);
  const callSites = error.stack;

  Error.prepareStackTrace = originalPrepare;

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
};
