import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Configuration validation runs at import time and calls process.exit(1) on
 * failure. Testing it in-process would terminate the test runner, so each case
 * runs in a child process from an empty temporary directory. The temporary
 * working directory prevents `dotenv` from reading the developer's real
 * server/.env, so no credentials can leak into the test or its output.
 */

const CONFIG_URL = pathToFileURL(
  fileURLToPath(new URL("../config/env.js", import.meta.url)),
).href;

function minimalEnvironment(overrides = {}) {
  const allowed = [
    "PATH",
    "SystemRoot",
    "ComSpec",
    "PATHEXT",
    "TEMP",
    "TMP",
    "USERPROFILE",
  ];
  const base = Object.fromEntries(
    allowed
      .filter((name) => process.env[name])
      .map((name) => [name, process.env[name]]),
  );

  return {
    ...base,
    ...overrides,
  };
}

async function runConfig(overrides) {
  const cwd = await mkdtemp(join(tmpdir(), "gj-env-test-"));
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          `import(${JSON.stringify(CONFIG_URL)})`,
        ],
        {
          cwd,
          env: minimalEnvironment(overrides),
          stdio: ["ignore", "pipe", "pipe"],
        },
      );

      let stdout = "";
      let stderr = "";
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error("Configuration check timed out."));
      }, 10000);

      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });
      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });
      child.on("error", reject);
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({ code, stdout, stderr });
      });
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

const VALID_BASE = Object.freeze({
  MONGODB_URI: "mongodb://test-user:test-pass@localhost:27017/growers_test",
  BETTER_AUTH_SECRET: "a-test-secret-that-is-at-least-32-characters",
  BETTER_AUTH_URL: "https://example.test",
  FRONTEND_URL: "https://example.test",
  PAYMENT_WEBHOOK_SECRET: "a-test-webhook-secret-at-least-32-characters",
  PAYMENT_PUBLIC_BASE_URL: "https://api.example.test",
});

test("missing required configuration exits 1 and prints variable names only", async () => {
  const result = await runConfig({ NODE_ENV: "production" });

  assert.equal(result.code, 1);
  const output = `${result.stdout}\n${result.stderr}`;
  assert.match(output, /MONGODB_URI/);
  assert.match(output, /BETTER_AUTH_SECRET/);
  assert.match(output, /BETTER_AUTH_URL/);
  assert.doesNotMatch(output, /test-pass/);
  assert.doesNotMatch(output, /mongodb\+srv/i);
});

test("FAKE payments are rejected in production", async () => {
  const result = await runConfig({
    NODE_ENV: "production",
    PAYMENTS_ENABLED: "true",
    PAYMENT_PROVIDER: "FAKE",
    PAYMENT_ENVIRONMENT: "SANDBOX",
    ...VALID_BASE,
  });

  assert.equal(result.code, 1);
  assert.match(`${result.stdout}\n${result.stderr}`, /FAKE cannot be used in production/);
});

test("enabling payments without an explicit NODE_ENV is rejected", async () => {
  const result = await runConfig({
    PAYMENTS_ENABLED: "true",
    PAYMENT_PROVIDER: "FAKE",
    PAYMENT_ENVIRONMENT: "SANDBOX",
    ...VALID_BASE,
  });

  assert.equal(result.code, 1);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /NODE_ENV must be set explicitly/,
  );
});
