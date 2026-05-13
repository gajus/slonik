export const stripArrayNotation = (identifierName: string): string => {
  let tail = identifierName.trim();

  while (tail.endsWith("[]")) {
    tail = tail.slice(0, -2);
  }

  return tail;
};
