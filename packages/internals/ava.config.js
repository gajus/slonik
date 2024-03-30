module.exports = () => {
  return {
    extensions: ['ts'],
    files: ['src/**/*.test.ts'],
    require: ['ts-node/register/transpile-only'],
    timeout: '30s',
  };
};
