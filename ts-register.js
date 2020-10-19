// ava/nyc can't be told to just require `@babel/register` directly, because that ignores typescript by default
require('@babel/register')({
  extensions: [".es6", ".es", ".jsx", ".js", ".mjs", ".ts"],
})
