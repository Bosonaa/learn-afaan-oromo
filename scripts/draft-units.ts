/**
 * Proposes Oromo answers for the authored curriculum by inverting the
 * lexicon's English glosses, then writes the unit YAML plus a review sheet.
 *
 * Inversion is unreliable on its own: an English gloss like "head" also
 * appears in unrelated senses, so every candidate is scored and flagged with a
 * confidence the reviewer can triage by. Nothing here is teaching-ready until
 * a fluent speaker signs off on the review sheet.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { stringify } from "yaml";
import { UNITS, type UnitSpec } from "../content/curriculum.js";
import { CONTENT_DIR, LEXICON_PATH, REVIEW_DIR } from "./config.js";
import type { Lexicon, LexiconEntry } from "./build-lexicon.js";

type Confidence = "high" | "medium" | "low" | "none";

interface Candidate {
  entry: LexiconEntry;
  score: number;
  exact: boolean;
}

interface DraftedWord {
  english: string;
  pos: string;
  oromo: string | null;
  alternates: string[];
  ipa: string | null;
  audioUrl: string | null;
  confidence: Confidence;
  glossSeen: string | null;
}

/** Splits "water, liquid (drinking)" into comparable gloss fragments. */
function glossFragments(gloss: string): string[] {
  return gloss
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .split(/[;,/]/)
    .map((fragment) => fragment.trim().replace(/^(to|a|an|the)\s+/, "").replace(/\.$/, ""))
    .filter((fragment) => fragment.length > 0);
}

function scoreCandidate(entry: LexiconEntry, english: string, pos: string): Candidate | null {
  let best: { score: number; exact: boolean } | null = null;

  for (const gloss of entry.glosses) {
    const fragments = glossFragments(gloss);
    const exact = fragments.includes(english);
    const partial = !exact && fragments.some((fragment) => fragment.split(" ").includes(english));
    if (!exact && !partial) continue;

    // An exact, single-sense gloss is the strongest signal that this Oromo word
    // is *the* word for this concept rather than a related sense.
    let score = exact ? 100 : 40;
    if (fragments.length === 1) score += 15;
    if (entry.pos === pos) score += 20;
    if (entry.audioUrl !== null) score += 10;
    if (entry.ipa.length > 0) score += 3;
    // Multi-word Oromo phrases are usually descriptions, not the headword.
    if (entry.oromo.includes(" ")) score -= 25;
    // Many competing senses on one entry means the mapping is muddier.
    score -= Math.min(entry.glosses.length, 10);

    if (best === null || score > best.score) best = { score, exact };
  }

  return best === null ? null : { entry, score: best.score, exact: best.exact };
}

function confidenceOf(candidates: Candidate[]): Confidence {
  const top = candidates[0];
  if (top === undefined) return "none";
  const runnerUp = candidates[1];
  const clear = runnerUp === undefined || top.score - runnerUp.score >= 20;
  if (top.exact && clear && top.entry.pos !== "unknown") return "high";
  if (top.exact) return "medium";
  return "low";
}

function draftWord(spec: UnitSpec["words"][number], lexicon: Lexicon): DraftedWord {
  const candidates = lexicon.entries
    .flatMap((entry) => {
      const scored = scoreCandidate(entry, spec.english, spec.pos);
      return scored === null ? [] : [scored];
    })
    .sort((a, b) => b.score - a.score);

  const top = candidates[0];
  if (top === undefined) {
    return {
      english: spec.english,
      pos: spec.pos,
      oromo: null,
      alternates: [],
      ipa: null,
      audioUrl: null,
      confidence: "none",
      glossSeen: null,
    };
  }

  const alternates = [...new Set(candidates.slice(1, 5).map((candidate) => candidate.entry.oromo))];
  return {
    english: spec.english,
    pos: spec.pos,
    oromo: top.entry.oromo,
    alternates,
    ipa: top.entry.ipa[0] ?? null,
    audioUrl: top.entry.audioUrl,
    confidence: confidenceOf(candidates),
    glossSeen: top.entry.glosses[0] ?? null,
  };
}

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

async function main(): Promise<void> {
  const lexicon = JSON.parse(await readFile(LEXICON_PATH, "utf8")) as Lexicon;
  await mkdir(resolve(CONTENT_DIR, "units"), { recursive: true });
  await mkdir(REVIEW_DIR, { recursive: true });

  const rows: string[] = [
    [
      "unit",
      "english",
      "pos",
      "proposed_oromo",
      "alternates",
      "ipa",
      "has_audio",
      "confidence",
      "gloss_seen",
      "verdict_ok_or_fix",
      "notes",
    ].join(","),
  ];
  const tally: Record<Confidence, number> = { high: 0, medium: 0, low: 0, none: 0 };
  let withAudio = 0;

  for (const unit of UNITS) {
    const words = unit.words.map((spec) => draftWord(spec, lexicon));
    for (const word of words) {
      tally[word.confidence] += 1;
      if (word.audioUrl !== null) withAudio += 1;
      rows.push(
        [
          unit.id,
          word.english,
          word.pos,
          word.oromo ?? "",
          word.alternates.join(" | "),
          word.ipa ?? "",
          word.audioUrl === null ? "no" : "yes",
          word.confidence,
          word.glossSeen ?? "",
          "",
          "",
        ]
          .map(csvCell)
          .join(","),
      );
    }

    const path = resolve(CONTENT_DIR, "units", `${unit.id}.yaml`);
    await writeFile(
      path,
      stringify({
        id: unit.id,
        order: unit.order,
        title: unit.title,
        status: "draft-unreviewed",
        source: lexicon.source,
        words,
      }),
      "utf8",
    );
    console.log(`wrote ${path} (${words.length} words)`);
  }

  const reviewPath = resolve(REVIEW_DIR, "units-01-03-review.csv");
  await writeFile(reviewPath, `${rows.join("\n")}\n`, "utf8");

  const total = Object.values(tally).reduce((sum, count) => sum + count, 0);
  console.log(`\nwrote ${reviewPath}`);
  console.log(`words: ${total}`);
  console.log(
    `confidence: high ${tally.high}, medium ${tally.medium}, low ${tally.low}, no match ${tally.none}`,
  );
  console.log(`with pronunciation audio: ${withAudio} (${Math.round((100 * withAudio) / total)}%)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
