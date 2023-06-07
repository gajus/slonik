export type DeferredPromise<ValueType> = {
  promise: Promise<ValueType>;
  reject: (error: unknown) => void;
  resolve: (value: ValueType) => void;
};

export const defer = <T>(): DeferredPromise<T> => {
  const deferred = {} as DeferredPromise<T>;

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
};
