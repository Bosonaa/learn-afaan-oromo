/**
 * Builds a fully static copy of the app in `out/`, for hosting somewhere the
 * kids (and a reviewer with only a phone) can reach without a laptop running.
 *
 * Everything the children use is static already — content is baked in at build
 * time and progress lives in the browser. Only the local-only API routes stand
 * in the way of `next export`, so they are moved aside for the build and put
 * back afterwards; without them the review page falls back to keeping answers
 * on the reviewer's device.
 */
import { spawnSync } from "node:child_process";
import { rename } from "node:fs/promises";
import { resolve } from "node:path";

const API = resolve(process.cwd(), "app", "api");
const PARKED = resolve(process.cwd(), ".api-local-only");

async function main(): Promise<void> {
  await rename(API, PARKED);
  try {
    const build = spawnSync("npx", ["next", "build"], {
      stdio: "inherit",
      env: { ...process.env, STATIC_EXPORT: "1" },
    });
    if (build.status !== 0) process.exitCode = build.status ?? 1;
  } finally {
    await rename(PARKED, API);
  }
}

void main();
