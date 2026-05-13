export const countArrayDimensions = (identifierName: string): number => {
  let tail = identifierName.trim();
  let arrayDimensionCount = 0;

  while (tail.endsWith("[]")) {
    arrayDimensionCount++;

    tail = tail.slice(0, -2);
  }

  return arrayDimensionCount;
};
