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
import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const API = resolve(process.cwd(), "app", "api");
const PARKED = resolve(process.cwd(), ".api-local-only");
const MANIFEST = resolve(process.cwd(), "out", "manifest.webmanifest");

interface Manifest {
  start_url: string;
  scope: string;
  icons: { src: string }[];
}

/**
 * The manifest is a static file, so its paths are written for a site at the
 * root; a subdirectory deployment needs them moved under the prefix.
 */
async function prefixManifest(basePath: string): Promise<void> {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8")) as Manifest;

  manifest.start_url = `${basePath}${manifest.start_url}`;
  manifest.scope = `${basePath}${manifest.scope}`;
  manifest.icons = manifest.icons.map((icon) => ({
    ...icon,
    src: `${basePath}${icon.src}`,
  }));

  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function main(): Promise<void> {
  await rename(API, PARKED);
  try {
    const build = spawnSync("npx", ["next", "build"], {
      stdio: "inherit",
      env: {
        ...process.env,
        STATIC_EXPORT: "1",
        // Next compiles the client in worker processes, so the browser copy of
        // the prefix has to be a real environment variable, not config.
        NEXT_PUBLIC_BASE_PATH: process.env.BASE_PATH ?? "",
      },
    });
    if (build.status !== 0) {
      process.exitCode = build.status ?? 1;
      return;
    }

    const basePath = process.env.BASE_PATH ?? "";
    if (basePath !== "") await prefixManifest(basePath);
  } finally {
    await rename(PARKED, API);
  }
}

void main();
