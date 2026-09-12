/**
 * Writes the phrase sets: the authored English sentences plus whatever a fluent
 * speaker has typed into `content/overrides.yaml`.
 *
 * Unlike the word units there is nothing to propose — the lexicon holds four
 * phrase entries in 16,011, and stitching sentences out of single words would
 * teach broken grammar — so a phrase with no override ships with `oromo: null`
 * and the app leaves it out of lessons.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { stringify } from "yaml";
import { PHRASE_SETS } from "../content/courses/oromo/phrasebook.js";
import { coursePhrasesDir, REVIEW_DIR } from "./config.js";
import { loadOverrides } from "../lib/overrides.js";

const COURSE_ID = "oromo";

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

async function main(): Promise<void> {
  const overrides = await loadOverrides();
  const dir = coursePhrasesDir(COURSE_ID);
  await mkdir(dir, { recursive: true });
  await mkdir(REVIEW_DIR, { recursive: true });

  const rows = [
    ["set", "english", "context", "afaan_oromo", "alternates", "reviewer", "notes"].join(","),
  ];
  let translated = 0;
  let total = 0;

  for (const set of PHRASE_SETS) {
    const setOverrides = overrides[set.id] ?? {};
    const words = set.phrases.map((phrase) => {
      const override = setOverrides[phrase.english];
      return {
        english: phrase.english,
        pos: "phrase",
        note: phrase.note ?? null,
        oromo: override?.oromo ?? null,
        alternates: override?.alternates ?? [],
        ipa: null,
        audioUrl: null,
        confidence: override === undefined ? "none" : "high",
        glossSeen: null,
        verified: override !== undefined,
        ...(override?.reviewer === undefined ? {} : { reviewer: override.reviewer }),
      };
    });

    total += words.length;
    translated += words.filter((word) => word.oromo !== null).length;
    for (const word of words) {
      rows.push(
        [
          set.id,
          csvCell(word.english),
          csvCell(word.note ?? ""),
          csvCell(word.oromo ?? ""),
          csvCell(word.alternates.join(" | ")),
          csvCell(typeof word.reviewer === "string" ? word.reviewer : ""),
          "",
        ].join(","),
      );
    }

    const path = resolve(dir, `${set.id}.yaml`);
    await writeFile(
      path,
      stringify({
        id: set.id,
        order: set.order,
        title: set.title,
        kind: "phrases",
        status: words.every((word) => word.verified) ? "reviewed" : "draft-unreviewed",
        source: "authored in content/courses/oromo/phrasebook.ts; answers from a fluent speaker",
        words,
      }),
      "utf8",
    );
    console.log(`wrote ${path} (${words.length} phrases, ${words.filter((w) => w.oromo).length} answered)`);
  }

  const reviewPath = resolve(REVIEW_DIR, "all-phrases-review.csv");
  await writeFile(reviewPath, `${rows.join("\n")}\n`, "utf8");
  console.log(`\nwrote ${reviewPath}`);
  console.log(`phrases: ${total}, answered by a fluent speaker: ${translated}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
