import assert from "node:assert/strict";
import test from "node:test";

import { assertBearerToken, assertCronAuthRequest } from "./cron-auth.mjs";

const MISSING_AUTH_HEADER = /Missing Authorization header/;
const INVALID_AUTH_HEADER = /Invalid Authorization header/;
const MISSING_BEARER_TOKEN = /Missing bearer token/;
const MISSING_CRON_TOKEN_ENV =
  /Missing required environment variable: CRON_TOKEN/;
const UNAUTHORIZED = /Unauthorized/;

test("rejects missing authorization header", () => {
  assert.throws(() => {
    assertBearerToken(null, "expected-token");
  }, MISSING_AUTH_HEADER);
});

test("rejects non-bearer authorization header", () => {
  assert.throws(() => {
    assertBearerToken("Basic abc123", "expected-token");
  }, INVALID_AUTH_HEADER);
});

test("rejects empty bearer token", () => {
  assert.throws(() => {
    assertBearerToken("Bearer   ", "expected-token");
  }, MISSING_BEARER_TOKEN);
});

test("rejects missing expected cron token", () => {
  assert.throws(() => {
    assertBearerToken("Bearer expected-token", "");
  }, MISSING_CRON_TOKEN_ENV);
});

test("rejects wrong bearer token", () => {
  assert.throws(() => {
    assertBearerToken("Bearer wrong-token", "expected-token");
  }, UNAUTHORIZED);
});

test("accepts a matching bearer token", () => {
  assert.doesNotThrow(() => {
    assertBearerToken("Bearer expected-token", "expected-token");
  });
});

test("extracts authorization from Request headers", () => {
  const request = new Request(
    "https://example.com/functions/v1/sync-fixtures",
    {
      headers: { Authorization: "Bearer expected-token" },
      method: "POST",
    }
  );

  assert.doesNotThrow(() => {
    assertCronAuthRequest(request, "expected-token");
  });
});
