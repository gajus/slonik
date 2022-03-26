const got = require('got');
const JSON5 = require('json5');

const parseDat = (subject) => {
  // I was not able to identify what is the file format that pg_type.dat uses, i.e. what parser to use.
  // However, making these modifications makes it similar enough to JSON5 compatible format to parse correctly.
  return JSON5.parse(subject.replaceAll('#', '//').replaceAll(' => ', ': '));
};

const main = async () => {
  const pgTypesDocument = await got('https://raw.githubusercontent.com/postgres/postgres/master/src/include/catalog/pg_type.dat', {
    resolveBodyOnly: true,
  });

  const pgTypes = parseDat(pgTypesDocument)
    .map((pgType) => {
      return pgType.typname;
    })
    .sort((a, b) => {
      return a.localeCompare(b);
    })
    .map((typeName) => {
      return `'${typeName}'`;
    })
    .join('\n | ');

  console.log(pgTypes);
};

void main();
