#!/usr/bin/env node
/**
 * Agent-facing backlog CLI — authenticated app HTTP API only (not service-role SQL).
 *
 * Env:
 *   BASE_URL          default http://127.0.0.1:4321
 *   DEMO_EMAIL / DEMO_PASSWORD  (or E2E_*)
 *
 * Usage:
 *   node scripts/backlog-cli.mjs help
 *   node scripts/backlog-cli.mjs list
 *   node scripts/backlog-cli.mjs create "Title"
 *   node scripts/backlog-cli.mjs get <id>
 *   node scripts/backlog-cli.mjs readiness <id>
 *   node scripts/backlog-cli.mjs patch <id> '{"goal":"..."}'
 *   node scripts/backlog-cli.mjs archive <id>
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4321";
const email = process.env.DEMO_EMAIL ?? process.env.E2E_EMAIL;
const password = process.env.DEMO_PASSWORD ?? process.env.E2E_PASSWORD;
const cookieJar = process.env.BACKLOG_COOKIE_JAR ?? join(tmpdir(), "securesprint-backlog-cookies.txt");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function requireCreds() {
  if (!email || !password) {
    fail("Set DEMO_EMAIL and DEMO_PASSWORD (or E2E_*) in the environment.");
  }
}

function curlJson(args) {
  const result = spawnSync(
    "curl",
    ["-sS", "-b", cookieJar, "-c", cookieJar, "-H", `Origin: ${base}`, ...args],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    fail(result.stderr || `curl failed with ${String(result.status)}`);
  }
  return result.stdout;
}

function signIn() {
  requireCreds();
  mkdirSync(join(cookieJar, ".."), { recursive: true });
  if (!existsSync(cookieJar)) writeFileSync(cookieJar, "");
  const code = spawnSync(
    "curl",
    [
      "-sS",
      "-o",
      "/dev/null",
      "-w",
      "%{http_code}",
      "-c",
      cookieJar,
      "-b",
      cookieJar,
      "-X",
      "POST",
      `${base}/api/auth/signin`,
      "-H",
      `Origin: ${base}`,
      "-H",
      `Referer: ${base}/auth/signin`,
      "-H",
      "Content-Type: application/x-www-form-urlencoded",
      "--data-urlencode",
      `email=${email}`,
      "--data-urlencode",
      `password=${password}`,
    ],
    { encoding: "utf8" },
  );
  const http = (code.stdout || "").trim();
  if (http !== "302" && http !== "303" && http !== "307") {
    fail(`Sign-in failed (HTTP ${http}). Is the app running at ${base}?`);
  }
}

function printHelp() {
  console.log(`SecureSprint backlog CLI (app HTTP API)

Commands:
  help
  list
  create <title>
  get <id>
  readiness <id>
  patch <id> <json-body>
  archive <id>

Env: BASE_URL, DEMO_EMAIL, DEMO_PASSWORD (or E2E_*), optional BACKLOG_COOKIE_JAR
Default write path: authenticated /api/stories — not Supabase service-role SQL.
`);
}

const [cmd, ...rest] = process.argv.slice(2);
if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
  printHelp();
  process.exit(0);
}

signIn();

if (cmd === "list") {
  console.log(curlJson([`${base}/api/stories`]));
} else if (cmd === "create") {
  const title = rest.join(" ").trim() || "Untitled backlog item";
  console.log(
    curlJson([
      "-X",
      "POST",
      `${base}/api/stories`,
      "-H",
      "Content-Type: application/json",
      "-d",
      JSON.stringify({ title }),
    ]),
  );
} else if (cmd === "get") {
  const id = rest[0];
  if (!id) fail("get requires <id>");
  console.log(curlJson([`${base}/api/stories/${id}`]));
} else if (cmd === "readiness") {
  const id = rest[0];
  if (!id) fail("readiness requires <id>");
  console.log(curlJson([`${base}/api/stories/${id}/readiness`]));
} else if (cmd === "patch") {
  const id = rest[0];
  const body = rest[1];
  if (!id || !body) fail('patch requires <id> and JSON body, e.g. \'{"goal":"..."}\'');
  console.log(
    curlJson([
      "-X",
      "PATCH",
      `${base}/api/stories/${id}`,
      "-H",
      "Content-Type: application/json",
      "-d",
      body,
    ]),
  );
} else if (cmd === "archive") {
  const id = rest[0];
  if (!id) fail("archive requires <id>");
  const out = spawnSync(
    "curl",
    [
      "-sS",
      "-o",
      "/dev/null",
      "-w",
      "%{http_code}",
      "-b",
      cookieJar,
      "-c",
      cookieJar,
      "-X",
      "DELETE",
      `${base}/api/stories/${id}`,
      "-H",
      `Origin: ${base}`,
    ],
    { encoding: "utf8" },
  );
  console.log(JSON.stringify({ status: Number((out.stdout || "").trim()) }));
} else {
  fail(`Unknown command: ${cmd}`);
}
