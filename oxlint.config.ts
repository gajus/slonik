import { config } from "oxlint-config-canonical";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [config],
  ignorePatterns: ["**/dist/", "**/.*/", "**/CHANGELOG.md"],
  overrides: [
    {
      files: ["**/*.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "id-length": "off",
        "no-promise-executor-return": "off",
        "no-unused-expressions": "off",
        "no-unused-vars": "off",
        "no-warning-comments": "off",
        "perfectionist/sort-classes": "off",
        "perfectionist/sort-modules": "off",
      },
    },
  ],
});
