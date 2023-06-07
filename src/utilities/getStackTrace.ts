export const getStackTrace = () => {
  const oldStackTraceLimit = Error.stackTraceLimit;
  const oldPrepareStackTrace = Error.prepareStackTrace;

  Error.prepareStackTrace = (error, structuredStackTrace) => {
    return structuredStackTrace;
  };

  const honeypot: { stack: NodeJS.CallSite[] } = {
    stack: [],
  };

  Error.captureStackTrace(honeypot);

  const callSites = honeypot.stack;

  Error.stackTraceLimit = oldStackTraceLimit;
  Error.prepareStackTrace = oldPrepareStackTrace;

  const trail: readonly NodeJS.CallSite[] = callSites.slice(1);

  return trail.map((callSite) => {
    return {
      columnNumber: callSite.getColumnNumber(),
      fileName: callSite.getFileName() ?? null,
      functionName: callSite.getFunctionName(),
      lineNumber: callSite.getLineNumber(),
    };
  });
};
