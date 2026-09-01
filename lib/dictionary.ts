import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { mirroredClips, slugify } from "./audio";

/** One headword of the open lexicon, as mirrored by scripts/build-lexicon.ts. */
interface RawEntry {
  oromo: string;
  pos: string;
  glosses: string[];
  ipa: string[];
  audioUrl: string | null;
}

interface RawLexicon {
  source: { name: string; url: string; license: string };
  entries: RawEntry[];
}

export interface DictionaryEntry {
  oromo: string;
  pos: string;
  glosses: string[];
  ipa: string | null;
  /** Locally mirrored clip, or null when Commons has none for this headword. */
  audio: string | null;
}

export interface DictionarySource {
  name: string;
  url: string;
  license: string;
}

export interface DictionaryStats {
  entries: number;
  withAudio: number;
}

const LEXICON_PATH = resolve(process.cwd(), "data", "lexicon.json");
const RESULT_LIMIT = 50;

/** Parsing 16k entries is slow enough to be worth doing once per server process. */
let cached: Promise<{
  entries: DictionaryEntry[];
  source: DictionarySource;
  stats: DictionaryStats;
}> | null = null;

async function load(): Promise<{
  entries: DictionaryEntry[];
  source: DictionarySource;
  stats: DictionaryStats;
}> {
  const [raw, clips] = await Promise.all([
    readFile(LEXICON_PATH, "utf8").then((text) => JSON.parse(text) as RawLexicon),
    mirroredClips(),
  ]);

  const entries = raw.entries.map((entry): DictionaryEntry => {
    const file = `${slugify(entry.oromo)}.mp3`;
    return {
      oromo: entry.oromo,
      pos: entry.pos,
      glosses: entry.glosses,
      ipa: entry.ipa[0] ?? null,
      audio: clips.has(file) ? `/audio/${file}` : null,
    };
  });

  return {
    entries,
    source: raw.source,
    stats: {
      entries: entries.length,
      withAudio: entries.filter((entry) => entry.audio !== null).length,
    },
  };
}

function lexicon(): Promise<{
  entries: DictionaryEntry[];
  source: DictionarySource;
  stats: DictionaryStats;
}> {
  cached ??= load();
  return cached;
}

export async function dictionaryMeta(): Promise<{
  source: DictionarySource;
  stats: DictionaryStats;
}> {
  const { source, stats } = await lexicon();
  return { source, stats };
}

/**
 * Ranks a headword against a query, searching both directions at once: the
 * Oromo spelling and the English glosses. Higher is better; null means no match.
 */
function score(entry: DictionaryEntry, query: string): number | null {
  const oromo = entry.oromo.toLowerCase();
  if (oromo === query) return 100;

  const glosses = entry.glosses.map((gloss) => gloss.toLowerCase());
  // An English word standing alone as a gloss is the translation we want to surface.
  if (glosses.some((gloss) => gloss === query)) return 90;
  if (oromo.startsWith(query)) return 80;
  if (glosses.some((gloss) => gloss.split(/[;,()]|\bor\b/).some((part) => part.trim() === query))) {
    return 70;
  }
  if (glosses.some((gloss) => new RegExp(`\\b${escapeRegExp(query)}\\b`).test(gloss))) return 60;
  if (oromo.includes(query)) return 40;
  if (glosses.some((gloss) => gloss.includes(query))) return 20;
  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface DictionaryResults {
  entries: DictionaryEntry[];
  /** Total matches, so the UI can say when it is only showing the first page. */
  matches: number;
}

export async function searchDictionary(query: string): Promise<DictionaryResults> {
  const needle = query.trim().toLowerCase();
  if (needle.length < 2) return { entries: [], matches: 0 };

  const { entries } = await lexicon();
  const scored: { entry: DictionaryEntry; score: number }[] = [];
  for (const entry of entries) {
    const value = score(entry, needle);
    if (value !== null) scored.push({ entry, score: value });
  }

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      // Prefer words someone can hear, then the shorter, more basic headword.
      Number(b.entry.audio !== null) - Number(a.entry.audio !== null) ||
      a.entry.oromo.length - b.entry.oromo.length ||
      a.entry.oromo.localeCompare(b.entry.oromo),
  );

  return {
    entries: scored.slice(0, RESULT_LIMIT).map((hit) => hit.entry),
    matches: scored.length,
  };
}
