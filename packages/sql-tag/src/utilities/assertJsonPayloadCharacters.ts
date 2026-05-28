import { InvalidInputError } from "@slonik/errors";

const NULL_BYTE_REGEX = /\u0000/;
const LONE_SURROGATE_REGEX =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

const assertStringIsPgJsonSafe = (value: string, path: string): void => {
  if (NULL_BYTE_REGEX.test(value)) {
    throw new InvalidInputError(
      `JSON payload string at ${path} contains a null byte (U+0000), which PostgreSQL does not permit in jsonb/json values.`,
    );
  }

  if (LONE_SURROGATE_REGEX.test(value)) {
    throw new InvalidInputError(
      `JSON payload string at ${path} contains an unpaired UTF-16 surrogate, which PostgreSQL does not permit in jsonb/json values.`,
    );
  }
};

export const assertJsonPayloadCharacters = (value: unknown, path = "$"): void => {
  if (typeof value === "string") {
    assertStringIsPgJsonSafe(value, path);
    return;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      assertJsonPayloadCharacters(value[index], `${path}[${index}]`);
    }

    return;
  }

  if (value !== null && typeof value === "object") {
    for (const key of Object.keys(value)) {
      assertJsonPayloadCharacters((value as Record<string, unknown>)[key], `${path}.${key}`);
    }
  }
};
