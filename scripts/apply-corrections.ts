/**
 * Folds a file of corrections back into the checkout.
 *
 * A fluent speaker reviewing on a phone has no checkout to write to, so the
 * review page keeps their answers on the device and exports them as JSON.
 * Run this on the file they send back:
 *
 *   npm run apply:corrections -- ~/Downloads/corrections-2026-08-17.json
 */
import { readFile } from "node:fs/promises";
import {
  applyToUnit,
  parseCorrection,
  recordOverride,
} from "@/lib/corrections";

interface Export {
  version?: number;
  corrections?: unknown[];
}

async function main(): Promise<void> {
  const path = process.argv[2];
  if (path === undefined) {
    throw new Error("usage: npm run apply:corrections -- <file.json>");
  }

  const body = JSON.parse(await readFile(path, "utf8")) as Export;
  const rows = Array.isArray(body.corrections) ? body.corrections : [];
  let applied = 0;

  for (const row of rows) {
    const correction = parseCorrection(row);
    if (correction === null) {
      console.warn("skipped an unusable correction");
      continue;
    }
    const hit = await applyToUnit(correction).catch(() => false);
    if (!hit) {
      console.warn(`skipped ${correction.unitId} / ${correction.english}`);
      continue;
    }
    await recordOverride(correction);
    applied += 1;
  }

  console.log(`applied ${applied} of ${rows.length} corrections`);
}

void main();
