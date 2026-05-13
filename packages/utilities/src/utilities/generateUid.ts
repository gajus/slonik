let counter = 0;

export const generateUid = (): string => {
  return (++counter).toString(16);
};
