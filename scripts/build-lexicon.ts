/**
 * Normalizes the raw wiktextract dump into the lexicon the app and the unit
 * drafter consume: one record per Oromo word, with part of speech, IPA,
 * pronunciation audio and English glosses.
 */
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { DATA_DIR, LEXICON_ATTRIBUTION, LEXICON_PATH, RAW_LEXICON_PATH } from "./config.js";

interface RawSound {
  ipa?: string;
  audio?: string;
  mp3_url?: string;
  ogg_url?: string;
}

interface RawSense {
  glosses?: string[];
  tags?: string[];
}

interface RawEntry {
  word: string;
  pos?: string;
  lang_code?: string;
  sounds?: RawSound[];
  senses?: RawSense[];
}

export interface LexiconEntry {
  oromo: string;
  pos: string;
  glosses: string[];
  ipa: string[];
  audioUrl: string | null;
  audioCredit: string | null;
}

export interface Lexicon {
  source: typeof LEXICON_ATTRIBUTION;
  generatedAt: string;
  entries: LexiconEntry[];
}

function normalizeGloss(gloss: string): string {
  return gloss.trim().replace(/\s+/g, " ");
}

async function readRawEntries(): Promise<RawEntry[]> {
  const entries: RawEntry[] = [];
  const reader = createInterface({
    input: createReadStream(RAW_LEXICON_PATH),
    crlfDelay: Infinity,
  });
  for await (const line of reader) {
    if (line.trim() === "") continue;
    entries.push(JSON.parse(line) as RawEntry);
  }
  return entries;
}

function toLexiconEntry(raw: RawEntry): LexiconEntry | null {
  const glosses = (raw.senses ?? [])
    .flatMap((sense) => sense.glosses ?? [])
    .map(normalizeGloss)
    .filter((gloss) => gloss.length > 0);
  if (glosses.length === 0) return null;

  const sounds = raw.sounds ?? [];
  const audio = sounds.find((sound) => typeof sound.mp3_url === "string");

  return {
    oromo: raw.word,
    pos: raw.pos ?? "unknown",
    glosses: [...new Set(glosses)],
    ipa: [...new Set(sounds.flatMap((sound) => (sound.ipa === undefined ? [] : [sound.ipa])))],
    audioUrl: audio?.mp3_url ?? null,
    audioCredit: audio?.audio ?? null,
  };
}

async function main(): Promise<void> {
  const raw = await readRawEntries();
  const entries = raw
    .filter((entry) => entry.lang_code === "om")
    .flatMap((entry) => {
      const normalized = toLexiconEntry(entry);
      return normalized === null ? [] : [normalized];
    });

  const lexicon: Lexicon = {
    source: LEXICON_ATTRIBUTION,
    generatedAt: new Date().toISOString(),
    entries,
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(LEXICON_PATH, `${JSON.stringify(lexicon, null, 2)}\n`, "utf8");

  const withAudio = entries.filter((entry) => entry.audioUrl !== null).length;
  console.log(`entries: ${entries.length}`);
  console.log(`with audio: ${withAudio}`);
  console.log(`wrote ${LEXICON_PATH}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
