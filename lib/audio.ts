import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

interface Credit {
  file: string;
}

const CREDITS_PATH = resolve(process.cwd(), "public", "audio", "credits.json");

/** Mirrors scripts/mirror-audio.ts so a word resolves to its clip without a lookup table. */
export function slugify(oromo: string): string {
  return oromo
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function mirroredClips(): Promise<Set<string>> {
  try {
    const credits = JSON.parse(await readFile(CREDITS_PATH, "utf8")) as Credit[];
    return new Set(credits.map((credit) => credit.file));
  } catch {
    return new Set();
  }
}
