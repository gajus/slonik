import { assertJsonPayloadCharacters } from "./assertJsonPayloadCharacters.js";
import test from "ava";

test("accepts plain ASCII", (t) => {
  t.notThrows(() => assertJsonPayloadCharacters({ foo: "bar" }));
});

test("accepts undefined and null", (t) => {
  t.notThrows(() => assertJsonPayloadCharacters(undefined));
  t.notThrows(() => assertJsonPayloadCharacters(null));
});

test("accepts numbers, booleans", (t) => {
  t.notThrows(() => assertJsonPayloadCharacters(42));
  t.notThrows(() => assertJsonPayloadCharacters(true));
});

test("accepts valid surrogate pairs", (t) => {
  t.notThrows(() => assertJsonPayloadCharacters("😀"));
});

test("rejects null byte in top-level string", (t) => {
  const error = t.throws(() => assertJsonPayloadCharacters("a\u0000b"));
  t.regex(error?.message ?? "", /null byte/);
  t.regex(error?.message ?? "", /\$/);
});

test("reports the path inside a nested object", (t) => {
  const error = t.throws(() => assertJsonPayloadCharacters({ a: { b: ["x", "y\u0000"] } }));
  t.regex(error?.message ?? "", /\$\.a\.b\[1\]/);
});

test("rejects lone high surrogate", (t) => {
  const error = t.throws(() => assertJsonPayloadCharacters("\uD800x"));
  t.regex(error?.message ?? "", /surrogate/);
});

test("rejects lone low surrogate", (t) => {
  const error = t.throws(() => assertJsonPayloadCharacters("x\uDC00"));
  t.regex(error?.message ?? "", /surrogate/);
});

test("rejects high surrogate at end of string", (t) => {
  const error = t.throws(() => assertJsonPayloadCharacters("ok\uD800"));
  t.regex(error?.message ?? "", /surrogate/);
});
