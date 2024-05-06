declare module 'pg-cursor';
declare module 'pg/lib/type-overrides' {
  const TypeOverrides: new () => {
    setTypeParser: (type: string, parser: (value: string) => unknown) => void;
  };

  export default TypeOverrides;
}
