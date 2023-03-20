declare module 'get-stack-trace' {
  export const getStackTrace: () => Promise<
    Array<{
      columnNumber: number;
      fileName: string;
      functionName: string | null;
      lineNumber: number;
    }>
  >;
}
declare module 'pg-cursor';
declare module 'pg-copy-streams-binary';
declare module 'pg/lib/type-overrides' {
  const TypeOverrides: new () => {
    setTypeParser: (type: string, parser: (value: string) => unknown) => void;
  };

  export default TypeOverrides;
}
