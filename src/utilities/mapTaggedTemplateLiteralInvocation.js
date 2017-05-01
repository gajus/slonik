// @flow

// eslint-disable-next-line flowtype/no-weak-types
export default (targetMethod: Function) => {
  // eslint-disable-next-line flowtype/no-weak-types
  return (maybeQuery: string | Array<string>, ...args: any) => {
    if (typeof maybeQuery === 'string') {
      return targetMethod(maybeQuery, args[0]);
    } else {
      const strings = maybeQuery;

      return targetMethod(strings.join('?'), args);
    }
  };
};
