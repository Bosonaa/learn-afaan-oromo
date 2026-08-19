/**
 * Downloads the Wiktionary-derived Oromo lexicon (wiktextract via kaikki.org).
 *
 * Source data is CC BY-SA: derived work must keep attribution, which
 * build-lexicon.ts writes into the generated lexicon's `source` block.
 * The raw dump is ~92 MB and is gitignored; run this before build:lexicon.
 */
import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { DATA_DIR, RAW_LEXICON_PATH, LEXICON_SOURCE_URL } from "./config.js";

async function main(): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    const existing = await stat(RAW_LEXICON_PATH);
    if (existing.size > 0) {
      console.log(`already present: ${RAW_LEXICON_PATH} (${existing.size} bytes)`);
      return;
    }
  } catch {
    // not downloaded yet
  }

  console.log(`downloading ${LEXICON_SOURCE_URL}`);
  const response = await fetch(LEXICON_SOURCE_URL);
  if (!response.ok || response.body === null) {
    throw new Error(`download failed: HTTP ${response.status}`);
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(RAW_LEXICON_PATH));
  const written = await stat(RAW_LEXICON_PATH);
  console.log(`wrote ${RAW_LEXICON_PATH} (${written.size} bytes)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
