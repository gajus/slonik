import createHyperidGenerator from 'hyperid';

const generateHyperid = createHyperidGenerator({
  fixedLength: false,
  urlSafe: true,
});

export const createUid = (): string => {
  return generateHyperid();
};
