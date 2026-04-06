import { config } from "oxlint-config-canonical";
import { defineConfig } from "oxlint";

// Remove rule not yet supported by oxlint
for (const override of config.overrides ?? []) {
  if (override.rules) {
    delete override.rules["unicorn/no-abusive-oxlint-disable"];
  }
}

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
