export type DeferredPromise<T> = {
  promise: Promise<T>;
  reject: (error: Error) => void;
  resolve: (value: T) => void;
};

export const defer = <T>(): DeferredPromise<T> => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;

  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  if (!resolve) {
    throw new Error('Expected resolve');
  }

  if (!reject) {
    throw new Error('Expected reject');
  }

  return {
    promise,
    reject,
    resolve,
  };
};
